package com.billcraft.studio.ui.adapters;

import android.net.Uri;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.billcraft.studio.R;
import com.bumptech.glide.Glide;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

public class PageThumbnailsAdapter extends RecyclerView.Adapter<PageThumbnailsAdapter.ViewHolder> {

    private final List<File> pageFiles = new ArrayList<>();
    private OnPageDeleteListener deleteListener;

    public interface OnPageDeleteListener {
        void onDelete(int position);
    }

    public void setOnPageDeleteListener(OnPageDeleteListener listener) {
        this.deleteListener = listener;
    }

    public void addPage(File file) {
        pageFiles.add(file);
        notifyItemInserted(pageFiles.size() - 1);
    }

    public void removePage(int position) {
        if (position >= 0 && position < pageFiles.size()) {
            pageFiles.remove(position);
            notifyItemRemoved(position);
            notifyItemRangeChanged(position, pageFiles.size());
        }
    }

    public List<File> getPageFiles() {
        return pageFiles;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_page_thumbnail, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        File file = pageFiles.get(position);
        holder.tvPageNumber.setText("P" + (position + 1));
        Glide.with(holder.itemView.getContext())
             .load(Uri.fromFile(file))
             .into(holder.ivThumbnail);

        holder.btnDeletePage.setOnClickListener(v -> {
            if (deleteListener != null) {
                deleteListener.onDelete(position);
            }
        });
    }

    @Override
    public int getItemCount() {
        return pageFiles.size();
    }

    public static class ViewHolder extends RecyclerView.ViewHolder {
        ImageView ivThumbnail, btnDeletePage;
        TextView tvPageNumber;

        public ViewHolder(@NonNull View itemView) {
            super(itemView);
            ivThumbnail = itemView.findViewById(R.id.ivThumbnail);
            btnDeletePage = itemView.findViewById(R.id.btnDeletePage);
            tvPageNumber = itemView.findViewById(R.id.tvPageNumber);
        }
    }
}
