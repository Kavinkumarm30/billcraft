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
    public void setCompanyName(String companyName) { this.companyName = companyName; }

    public String getAddress() { return address != null ? address : ""; }
    public void setAddress(String address) { this.address = address; }

    public String getPhone() { return phone != null ? phone : ""; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEmail() { return email != null ? email : ""; }
    public void setEmail(String email) { this.email = email; }

    public String getGstNo() { return gstNo != null ? gstNo : ""; }
    public void setGstNo(String gstNo) { this.gstNo = gstNo; }

    public String getBankName() { return bankName != null ? bankName : ""; }
    public void setBankName(String bankName) { this.bankName = bankName; }

    public String getAccountNo() { return accountNo != null ? accountNo : ""; }
    public void setAccountNo(String accountNo) { this.accountNo = accountNo; }

    public String getIfsc() { return ifsc != null ? ifsc : ""; }
    public void setIfsc(String ifsc) { this.ifsc = ifsc; }

    public String getUpiId() { return upiId != null ? upiId : ""; }
    public void setUpiId(String upiId) { this.upiId = upiId; }

    public String getInvoicePrefix() { return invoicePrefix != null ? invoicePrefix : "INV-"; }
    public void setInvoicePrefix(String invoicePrefix) { this.invoicePrefix = invoicePrefix; }

    public String getInvoiceLayout() { return invoiceLayout != null ? invoiceLayout : "standard"; }
    public void setInvoiceLayout(String invoiceLayout) { this.invoiceLayout = invoiceLayout; }
}
