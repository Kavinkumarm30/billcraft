package com.billcraft.studio.models;

import com.google.gson.annotations.SerializedName;
import java.io.Serializable;

public class Customer implements Serializable {
    @SerializedName("id")
    private Integer id;

    @SerializedName("name")
    private String name;

    @SerializedName("phone")
    private String phone;

    @SerializedName("email")
    private String email;

    @SerializedName("address")
    private String address;

    @SerializedName("gstNo")
    private String gstNo;

    @SerializedName("createdAt")
    private String createdAt;

    public Integer getId() { return id; }
    public String getName() { return name != null ? name : ""; }
    public void setName(String name) { this.name = name; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getGstNo() { return gstNo; }
    public String getCreatedAt() { return createdAt; }
}
