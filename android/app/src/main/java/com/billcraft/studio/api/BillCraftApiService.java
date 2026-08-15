package com.billcraft.studio.api;

import com.billcraft.studio.models.CompanySettings;
import com.billcraft.studio.models.Customer;
import com.billcraft.studio.models.DashboardStats;
import com.billcraft.studio.models.Invoice;
import com.billcraft.studio.models.User;

import java.util.List;
import java.util.Map;

import okhttp3.MultipartBody;
import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.DELETE;
import retrofit2.http.GET;
import retrofit2.http.Multipart;
import retrofit2.http.POST;
import retrofit2.http.PUT;
import retrofit2.http.Part;
import retrofit2.http.Path;
import retrofit2.http.Query;

public interface BillCraftApiService {

    @GET("api/me")
    Call<User> getMe();

    @GET("api/dashboard")
    Call<DashboardStats> getDashboard();

    @GET("api/invoices")
    Call<List<Invoice>> getInvoices(
        @Query("page") int page,
        @Query("limit") int limit
    );

    @POST("api/invoices")
    Call<Invoice> createInvoice(@Body Invoice invoice);

    @PUT("api/invoices/{id}")
    Call<Invoice> updateInvoice(@Path("id") int id, @Body Invoice invoice);

    @DELETE("api/invoices/{id}")
    Call<Map<String, Object>> deleteInvoice(@Path("id") int id);

    @GET("api/customers")
    Call<List<Customer>> getCustomers(
        @Query("search") String search,
        @Query("page") int page,
        @Query("limit") int limit
    );

    @GET("api/settings")
    Call<CompanySettings> getSettings();

    @Multipart
    @POST("api/extract")
    Call<Invoice> extractMultiPageBill(@Part List<MultipartBody.Part> files);
}
