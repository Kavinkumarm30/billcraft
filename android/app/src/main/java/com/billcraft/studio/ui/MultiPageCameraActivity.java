package com.billcraft.studio.ui;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.ImageButton;
import android.widget.TextView;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.camera.core.CameraSelector;
import androidx.camera.core.ImageCapture;
import androidx.camera.core.ImageCaptureException;
import androidx.camera.core.Preview;
import androidx.camera.lifecycle.ProcessCameraProvider;
import androidx.camera.view.PreviewView;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.billcraft.studio.R;
import com.billcraft.studio.api.ApiClient;
import com.billcraft.studio.models.Invoice;
import com.billcraft.studio.ui.adapters.PageThumbnailsAdapter;
import com.google.common.util.concurrent.ListenableFuture;

import java.io.File;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import okhttp3.MediaType;
import okhttp3.MultipartBody;
import okhttp3.RequestBody;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class MultiPageCameraActivity extends AppCompatActivity {

    private static final int REQUEST_CODE_PERMISSIONS = 10;
    private static final String[] REQUIRED_PERMISSIONS = new String[]{Manifest.permission.CAMERA};

    private ImageCapture imageCapture;
    private File outputDirectory;
    private ExecutorService cameraExecutor;

    private PreviewView viewFinder;
    private TextView tvPagesCount;
    private Button btnDoneExtract;
    private PageThumbnailsAdapter thumbnailsAdapter;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_camera);

        viewFinder = findViewById(R.id.viewFinder);
        tvPagesCount = findViewById(R.id.tvPagesCount);
        btnDoneExtract = findViewById(R.id.btnDoneExtract);
        ImageButton btnShutter = findViewById(R.id.btnShutter);
        findViewById(R.id.btnCloseCamera).setOnClickListener(v -> finish());

        RecyclerView rvThumbnails = findViewById(R.id.rvThumbnails);
        rvThumbnails.setLayoutManager(new LinearLayoutManager(this, LinearLayoutManager.HORIZONTAL, false));
        thumbnailsAdapter = new PageThumbnailsAdapter();
        thumbnailsAdapter.setOnPageDeleteListener(position -> {
            thumbnailsAdapter.removePage(position);
            updatePageCount();
        });
        rvThumbnails.setAdapter(thumbnailsAdapter);

        if (allPermissionsGranted()) {
            startCamera();
        } else {
            ActivityCompat.requestPermissions(this, REQUIRED_PERMISSIONS, REQUEST_CODE_PERMISSIONS);
        }

        btnShutter.setOnClickListener(v -> takePhoto());
        btnDoneExtract.setOnClickListener(v -> submitForOcrExtraction());

        outputDirectory = getOutputDirectory();
        cameraExecutor = Executors.newSingleThreadExecutor();
    }

    private void takePhoto() {
        if (imageCapture == null) return;

        File photoFile = new File(
            outputDirectory,
            "bill_page_" + System.currentTimeMillis() + ".jpg"
        );

        ImageCapture.OutputFileOptions outputOptions = new ImageCapture.OutputFileOptions.Builder(photoFile).build();

        imageCapture.takePicture(
            outputOptions,
            ContextCompat.getMainExecutor(this),
            new ImageCapture.OnImageSavedCallback() {
                @Override
                public void onImageSaved(@NonNull ImageCapture.OutputFileResults outputFileResults) {
                    thumbnailsAdapter.addPage(photoFile);
                    updatePageCount();
                    Toast.makeText(MultiPageCameraActivity.this, "Page captured! Snap next page or Extract.", Toast.LENGTH_SHORT).show();
                }

                @Override
                public void onError(@NonNull ImageCaptureException exception) {
                    Toast.makeText(MultiPageCameraActivity.this, "Capture failed: " + exception.getMessage(), Toast.LENGTH_SHORT).show();
                }
            }
        );
    }

    private void updatePageCount() {
        int count = thumbnailsAdapter.getItemCount();
        if (count == 0) {
            tvPagesCount.setText("Page 1 (Snap consecutive pages)");
            btnDoneExtract.setVisibility(View.GONE);
        } else {
            tvPagesCount.setText(count + " page(s) captured - Ready for AI OCR");
            btnDoneExtract.setVisibility(View.VISIBLE);
        }
    }

    private void submitForOcrExtraction() {
        List<File> pages = thumbnailsAdapter.getPageFiles();
        if (pages.isEmpty()) {
            Toast.makeText(this, "Please snap at least one page", Toast.LENGTH_SHORT).show();
            return;
        }

        Toast.makeText(this, "Uploading " + pages.size() + " page(s) to Gemini AI...", Toast.LENGTH_LONG).show();

        List<MultipartBody.Part> parts = new ArrayList<>();
        for (File page : pages) {
            RequestBody requestFile = RequestBody.create(MediaType.parse("image/jpeg"), page);
            MultipartBody.Part body = MultipartBody.Part.createFormData("files", page.getName(), requestFile);
            parts.add(body);
        }

        ApiClient.getService(this).extractMultiPageBill(parts).enqueue(new Callback<Invoice>() {
            @Override
            public void onResponse(Call<Invoice> call, Response<Invoice> response) {
                if (response.isSuccessful() && response.body() != null) {
                    Invoice extractedInvoice = response.body();
                    Intent intent = new Intent(MultiPageCameraActivity.this, ReviewOcrActivity.class);
                    intent.putExtra("extracted_invoice", extractedInvoice);
                    startActivity(intent);
                    finish();
                } else {
                    Toast.makeText(MultiPageCameraActivity.this, "AI Extraction failed: " + response.message(), Toast.LENGTH_LONG).show();
                }
            }

            @Override
            public void onFailure(Call<Invoice> call, Throwable t) {
                Toast.makeText(MultiPageCameraActivity.this, "OCR Error: " + t.getMessage(), Toast.LENGTH_LONG).show();
            }
        });
    }

    private void startCamera() {
        ListenableFuture<ProcessCameraProvider> cameraProviderFuture = ProcessCameraProvider.getInstance(this);

        cameraProviderFuture.addListener(() -> {
            try {
                ProcessCameraProvider cameraProvider = cameraProviderFuture.get();

                Preview preview = new Preview.Builder().build();
                preview.setSurfaceProvider(viewFinder.getSurfaceProvider());

                imageCapture = new ImageCapture.Builder()
                        .setCaptureMode(ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY)
                        .build();

                CameraSelector cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA;

                cameraProvider.unbindAll();
                cameraProvider.bindToLifecycle(this, cameraSelector, preview, imageCapture);

            } catch (ExecutionException | InterruptedException e) {
                Toast.makeText(this, "Camera init failed: " + e.getMessage(), Toast.LENGTH_SHORT).show();
            }
        }, ContextCompat.getMainExecutor(this));
    }

    private boolean allPermissionsGranted() {
        for (String permission : REQUIRED_PERMISSIONS) {
            if (ContextCompat.checkSelfPermission(this, permission) != PackageManager.PERMISSION_GRANTED) {
                return false;
            }
        }
        return true;
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQUEST_CODE_PERMISSIONS) {
            if (allPermissionsGranted()) {
                startCamera();
            } else {
                Toast.makeText(this, "Camera permissions required for bill capture.", Toast.LENGTH_SHORT).show();
                finish();
            }
        }
    }

    private File getOutputDirectory() {
        File mediaDir = getExternalMediaDirs().length > 0 ? new File(getExternalMediaDirs()[0], getString(R.string.app_name)) : null;
        if (mediaDir != null && (mediaDir.exists() || mediaDir.mkdirs())) {
            return mediaDir;
        }
        return getFilesDir();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        cameraExecutor.shutdown();
    }
}
