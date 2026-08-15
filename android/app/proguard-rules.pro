# ProGuard / R8 rules for BillCraft Android App
-keep class com.billcraft.studio.models.** { *; }
-keepclassmembers class com.billcraft.studio.models.** { *; }

# Retrofit & OkHttp
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn retrofit2.**
-keepattributes Signature
-keepattributes *Annotation*
