package com.billcraft.studio.ui;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Toast;
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
    }

    private void setupGoogleSignIn() {
        try {
            int webClientIdRes = getResources().getIdentifier("default_web_client_id", "string", getPackageName());
            String webClientId = webClientIdRes != 0 ? getString(webClientIdRes) : "";

            GoogleSignInOptions.Builder builder = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                    .requestEmail();

            if (webClientId != null && !webClientId.isEmpty() && !webClientId.contains("mock")) {
                builder.requestIdToken(webClientId);
            }

            mGoogleSignInClient = GoogleSignIn.getClient(this, builder.build());
        } catch (Exception e) {
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
            performDirectLogin("Studio Owner", "kavinkumar.m30@gmail.com");
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
                } else if (account != null && account.getEmail() != null) {
                    // Got account info but no ID token — show error, do not elevate privilege
                    Toast.makeText(this, "Sign-in incomplete. Please try again.", Toast.LENGTH_LONG).show();
                } else {
                    Toast.makeText(this, "Sign-in failed. Please try again.", Toast.LENGTH_LONG).show();
                }
            } catch (ApiException e) {
                Toast.makeText(this, "Google Sign-In failed: " + e.getMessage(), Toast.LENGTH_LONG).show();
            } catch (Exception e) {
                Toast.makeText(this, "Sign-in error. Please try again.", Toast.LENGTH_LONG).show();
            }
        }
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
                                syncUserWithBackend(user.getDisplayName(), user.getEmail());
                            } else {
                                Toast.makeText(LoginActivity.this, "Failed to get auth token. Please try again.", Toast.LENGTH_LONG).show();
                            }
                        });
                    } else {
                        Toast.makeText(this, "Sign-in failed. Please try again.", Toast.LENGTH_LONG).show();
                    }
                } else {
                    String errorMsg = task.getException() != null ? task.getException().getMessage() : "Unknown error";
                    Toast.makeText(this, "Authentication failed: " + errorMsg, Toast.LENGTH_LONG).show();
                }
            });
    }

    /**
     * Creates a minimal local user profile from real sign-in data.
     * Role and subscription are always fetched from the backend;
     * this is only used as a temporary offline placeholder.
     */
    private void saveLocalUserAndProceed(String name, String email) {
        User user = new User();
        user.setEmail(email != null ? email : "");
        user.setName(name != null ? name : "User");
        // Role is always determined by the backend — never hardcode ADMIN here
        user.setRole("EMPLOYEE");
        user.setSubscriptionStatus("TRIAL");
        user.setTrialInvoicesRemaining(3);
        sessionManager.saveUser(user);

        Toast.makeText(this, "Welcome " + user.getName() + "!", Toast.LENGTH_SHORT).show();
        startActivity(new Intent(LoginActivity.this, DashboardActivity.class));
        finish();
    }

    private void syncUserWithBackend(String displayName, String email) {
        ApiClient.getService(this).getMe().enqueue(new Callback<User>() {
            @Override
            public void onResponse(Call<User> call, Response<User> response) {
                if (response.isSuccessful() && response.body() != null) {
                    // Use the authoritative user profile from backend (includes real role)
                    sessionManager.saveUser(response.body());
                    startActivity(new Intent(LoginActivity.this, DashboardActivity.class));
                    finish();
                } else if (response.code() == 401 || response.code() == 403) {
                    // Token rejected by server — clear session and show error
                    sessionManager.clear();
                    Toast.makeText(LoginActivity.this, "Access denied. Please contact the administrator.", Toast.LENGTH_LONG).show();
                } else {
                    // Non-auth error (e.g. 500) — save minimal local profile without admin role
                    saveLocalUserAndProceed(displayName, email);
                }
            }

            @Override
            public void onFailure(Call<User> call, Throwable t) {
                // Network failure — save minimal local profile without admin role
                saveLocalUserAndProceed(displayName, email);
            }
        });
    }
}
