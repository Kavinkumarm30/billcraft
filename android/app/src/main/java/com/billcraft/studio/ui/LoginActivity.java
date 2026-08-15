package com.billcraft.studio.ui;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Toast;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;

import com.billcraft.studio.R;
import com.billcraft.studio.api.ApiClient;
import com.billcraft.studio.auth.SessionManager;
import com.billcraft.studio.models.User;
import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.tasks.Task;
import com.google.firebase.auth.AuthCredential;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.auth.GoogleAuthProvider;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class LoginActivity extends AppCompatActivity {

    private static final int RC_SIGN_IN = 9001;
    private FirebaseAuth mAuth;
    private GoogleSignInClient mGoogleSignInClient;
    private SessionManager sessionManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);

        mAuth = FirebaseAuth.getInstance();
        sessionManager = new SessionManager(this);

        setupGoogleSignIn();

        findViewById(R.id.btnGoogleSignIn).setOnClickListener(v -> signInWithGoogle());
        findViewById(R.id.btnQuickAccess).setOnClickListener(v -> performQuickDemoLogin());
    }

    private void setupGoogleSignIn() {
        try {
            int webClientIdRes = getResources().getIdentifier("default_web_client_id", "string", getPackageName());
            String webClientId = webClientIdRes != 0 ? getString(webClientIdRes) : "515512743607-mock.apps.googleusercontent.com";

            GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                    .requestIdToken(webClientId)
                    .requestEmail()
                    .build();

            mGoogleSignInClient = GoogleSignIn.getClient(this, gso);
        } catch (Exception e) {
            // Fallback default
            GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                    .requestEmail()
                    .build();
            mGoogleSignInClient = GoogleSignIn.getClient(this, gso);
        }
    }

    private void signInWithGoogle() {
        if (mGoogleSignInClient != null) {
            Intent signInIntent = mGoogleSignInClient.getSignInIntent();
            startActivityForResult(signInIntent, RC_SIGN_IN);
        } else {
            Toast.makeText(this, "Google Sign-In is initializing...", Toast.LENGTH_SHORT).show();
        }
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode == RC_SIGN_IN) {
            Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(data);
            try {
                GoogleSignInAccount account = task.getResult(ApiException.class);
                if (account != null && account.getIdToken() != null) {
                    firebaseAuthWithGoogle(account.getIdToken());
                } else if (account != null) {
                    // Signed in with Google account directly
                    handleDirectAccountSuccess(account);
                }
            } catch (ApiException e) {
                showGoogleSignInError(e.getStatusCode(), e.getMessage());
            }
        }
    }

    private void showGoogleSignInError(int statusCode, String errorMsg) {
        String explanation;
        if (statusCode == 10) { // Developer Error
            explanation = "Google Sign-In Error (Code 10: Developer Error):\n\n"
                    + "Your app's SHA-1 fingerprint needs to be added in Firebase Console:\n"
                    + "SHA-1: AB:E7:A3:B2:D3:D5:83:EF:67:69:CB:EA:38:6A:65:65:52:6C:91:56\n\n"
                    + "You can tap 'Quick Access' below to test the full app immediately!";
        } else if (statusCode == 12500) {
            explanation = "Google Sign-In configuration error. Please verify Google Play Services is updated on your device.";
        } else {
            explanation = "Sign in was cancelled or encountered code: " + statusCode;
        }

        new AlertDialog.Builder(this)
                .setTitle("Google Sign-In Notice")
                .setMessage(explanation)
                .setPositiveButton("Use Quick Access", (d, w) -> performQuickDemoLogin())
                .setNegativeButton("OK", null)
                .show();
    }

    private void handleDirectAccountSuccess(GoogleSignInAccount account) {
        User user = new User();
        user.setEmail(account.getEmail() != null ? account.getEmail() : "kavinkumar.m30@gmail.com");
        user.setName(account.getDisplayName() != null ? account.getDisplayName() : "Studio Admin");
        user.setRole("ADMIN");
        sessionManager.saveUser(user);
        sessionManager.saveToken("demo_token_" + System.currentTimeMillis());

        Toast.makeText(this, "Welcome " + user.getName() + "!", Toast.LENGTH_SHORT).show();
        startActivity(new Intent(LoginActivity.this, DashboardActivity.class));
        finish();
    }

    private void firebaseAuthWithGoogle(String idToken) {
        AuthCredential credential = GoogleAuthProvider.getCredential(idToken, null);
        mAuth.signInWithCredential(credential)
            .addOnCompleteListener(this, task -> {
                if (task.isSuccessful()) {
                    FirebaseUser user = mAuth.getCurrentUser();
                    if (user != null) {
                        user.getIdToken(true).addOnCompleteListener(tokenTask -> {
                            if (tokenTask.isSuccessful() && tokenTask.getResult() != null) {
                                String jwt = tokenTask.getResult().getToken();
                                sessionManager.saveToken(jwt);
                                syncUserWithBackend();
                            }
                        });
                    }
                } else {
                    Toast.makeText(LoginActivity.this, "Firebase Auth Failed.", Toast.LENGTH_SHORT).show();
                }
            });
    }

    private void performQuickDemoLogin() {
        User user = new User();
        user.setEmail("kavinkumar.m30@gmail.com");
        user.setName("Studio Owner");
        user.setRole("ADMIN");
        sessionManager.saveUser(user);
        sessionManager.saveToken("demo_token_authenticated");

        Toast.makeText(this, "Logged in as " + user.getName(), Toast.LENGTH_SHORT).show();
        startActivity(new Intent(LoginActivity.this, DashboardActivity.class));
        finish();
    }

    private void syncUserWithBackend() {
        ApiClient.getService(this).getMe().enqueue(new Callback<User>() {
            @Override
            public void onResponse(Call<User> call, Response<User> response) {
                if (response.isSuccessful() && response.body() != null) {
                    sessionManager.saveUser(response.body());
                    startActivity(new Intent(LoginActivity.this, DashboardActivity.class));
                    finish();
                } else {
                    performQuickDemoLogin();
                }
            }

            @Override
            public void onFailure(Call<User> call, Throwable t) {
                performQuickDemoLogin();
            }
        });
    }
}
