package com.billcraft.studio.models;

import com.google.gson.annotations.SerializedName;
import java.io.Serializable;

public class CompanySettings implements Serializable {
    @SerializedName("companyName")
    private String companyName;

    @SerializedName("address")
    private String address;

    @SerializedName("phone")
    private String phone;

    @SerializedName("email")
    private String email;

    @SerializedName("gstNo")
    private String gstNo;

    @SerializedName("bankName")
    private String bankName;

    @SerializedName("accountNo")
    private String accountNo;

    @SerializedName("ifsc")
    private String ifsc;

    @SerializedName("upiId")
    private String upiId;

    @SerializedName("invoicePrefix")
    private String invoicePrefix;

    @SerializedName("invoiceLayout")
    private String invoiceLayout;

    public String getCompanyName() { return companyName != null ? companyName : "My Studio"; }
    public String getAddress() { return address != null ? address : ""; }
    public String getPhone() { return phone != null ? phone : ""; }
    public String getEmail() { return email != null ? email : ""; }
    public String getGstNo() { return gstNo != null ? gstNo : ""; }
    public String getBankName() { return bankName != null ? bankName : ""; }
    public String getAccountNo() { return accountNo != null ? accountNo : ""; }
    public String getIfsc() { return ifsc != null ? ifsc : ""; }
    public String getUpiId() { return upiId != null ? upiId : ""; }
    public String getInvoicePrefix() { return invoicePrefix != null ? invoicePrefix : "INV-"; }
    public String getInvoiceLayout() { return invoiceLayout != null ? invoiceLayout : "standard"; }
}
