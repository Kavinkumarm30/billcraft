package com.billcraft.studio.ui.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.billcraft.studio.R;
import com.billcraft.studio.models.InvoiceLayoutItem;

import java.util.ArrayList;
import java.util.List;

public class InvoiceLayoutsAdapter extends RecyclerView.Adapter<InvoiceLayoutsAdapter.LayoutViewHolder> {

    public interface OnLayoutSelectedListener {
        void onLayoutSelected(InvoiceLayoutItem item);
    }

    private List<InvoiceLayoutItem> layouts = new ArrayList<>();
    private String activeLayoutId = "standard";
    private OnLayoutSelectedListener listener;

    public InvoiceLayoutsAdapter(OnLayoutSelectedListener listener) {
        this.listener = listener;
    }

    public void setLayouts(List<InvoiceLayoutItem> list, String currentActiveId) {
        this.layouts = list;
        this.activeLayoutId = currentActiveId != null ? currentActiveId : "standard";
        notifyDataSetChanged();
    }

    public void setActiveLayoutId(String activeLayoutId) {
        this.activeLayoutId = activeLayoutId;
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public LayoutViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_invoice_layout_card, parent, false);
        return new LayoutViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull LayoutViewHolder holder, int position) {
        InvoiceLayoutItem item = layouts.get(position);
        holder.tvName.setText(item.getName());
        holder.tvBadge.setText(item.getBadge());
        holder.tvDesc.setText(item.getDesc());

        boolean isActive = item.getId().equalsIgnoreCase(activeLayoutId);
        if (isActive) {
            holder.tvActiveBadge.setVisibility(View.VISIBLE);
            holder.btnSelect.setVisibility(View.GONE);
        } else {
            holder.tvActiveBadge.setVisibility(View.GONE);
            holder.btnSelect.setVisibility(View.VISIBLE);
            holder.btnSelect.setOnClickListener(v -> {
                if (listener != null) {
                    listener.onLayoutSelected(item);
                }
            });
        }

        // Layout icon based on template
        if ("bold".equalsIgnoreCase(item.getId())) {
            holder.tvIcon.setText("⬛");
        } else if ("orange-classic".equalsIgnoreCase(item.getId())) {
            holder.tvIcon.setText("🟧");
        } else if ("tech".equalsIgnoreCase(item.getId())) {
            holder.tvIcon.setText("⚡");
        } else if ("elegant".equalsIgnoreCase(item.getId())) {
            holder.tvIcon.setText("✨");
        } else {
            holder.tvIcon.setText("📄");
        }
    }

    @Override
    public int getItemCount() {
        return layouts.size();
    }

    static class LayoutViewHolder extends RecyclerView.ViewHolder {
        TextView tvIcon, tvName, tvBadge, tvDesc, tvActiveBadge;
        Button btnSelect;

        public LayoutViewHolder(@NonNull View itemView) {
            super(itemView);
            tvIcon = itemView.findViewById(R.id.tvLayoutIcon);
            tvName = itemView.findViewById(R.id.tvLayoutName);
            tvBadge = itemView.findViewById(R.id.tvLayoutBadge);
            tvDesc = itemView.findViewById(R.id.tvLayoutDesc);
            tvActiveBadge = itemView.findViewById(R.id.tvActiveBadge);
            btnSelect = itemView.findViewById(R.id.btnSelectLayout);
        }
    }
}
