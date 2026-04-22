const PASSWORD_EXPIRY_DAYS = 90;

export async function checkPasswordExpiry(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("admin_users") // <-- BURASI DÜZELTİLDİ
    .select("password_changed_at")
    .eq("user_id", userId) // Eğer auth id kullanıyorsanız burası "auth_user_id" olabilir
    .single();

  if (error || !data.password_changed_at) return false;

  const lastChange = new Date(data.password_changed_at);
  const diffInDays = (new Date().getTime() - lastChange.getTime()) / (1000 * 3600 * 24);
  
  return diffInDays > PASSWORD_EXPIRY_DAYS;
}

export async function updateAdminPasswordWithTracking(newPassword: string): Promise<any> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Oturum bulunamadı." };

  const { error: authError } = await supabase.auth.updateUser({ password: newPassword });
  if (authError) return { data: null, error: authError.message };

  await supabase
    .from("admin_users") // <-- BURASI DÜZELTİLDİ
    .update({ password_changed_at: new Date().toISOString() })
    .eq("user_id", "1002"); // veya user.id

  return { data: null, error: null };
}
