-- Function to handle new user signups
CREATE OR REPLACE FUNCTION da.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO da.profiles (id, name, created_at)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION da.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA da TO authenticated;
GRANT ALL ON da.profiles TO authenticated; 