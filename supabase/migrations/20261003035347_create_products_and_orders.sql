/*
# Create products and orders tables for AnimeStore

1. New Tables
- `products`
  - `id` (uuid, primary key)
  - `name` (text, not null) - product name
  - `description` (text) - product description
  - `price` (numeric, not null) - price in NPR (Nepali Rupees)
  - `image_url` (text) - product image URL
  - `category` (text) - anime category (e.g. Naruto, One Piece, Demon Slayer)
  - `stock` (integer, default 0) - available stock
  - `created_at` (timestamp)
- `orders`
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, defaults to authenticated user) - references auth.users
  - `items` (jsonb) - array of {product_id, name, price, quantity}
  - `total` (numeric, not null) - total price in NPR
  - `payment_method` (text) - 'esewa' or 'bank'
  - `customer_name` (text)
  - `customer_email` (text)
  - `customer_phone` (text)
  - `customer_address` (text)
  - `status` (text, default 'pending') - pending, completed
  - `created_at` (timestamp)

2. Security
- Enable RLS on both tables.
- Products: public read (anon + authenticated), no public write.
- Orders: authenticated users can read/insert their own orders only.
*/

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  image_url text,
  category text,
  stock integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  items jsonb NOT NULL,
  total numeric NOT NULL,
  payment_method text NOT NULL,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text NOT NULL,
  customer_address text NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Products: public read
DROP POLICY IF EXISTS "public_read_products" ON products;
CREATE POLICY "public_read_products" ON products FOR SELECT
TO anon, authenticated USING (true);

-- Orders: authenticated users can read their own orders
DROP POLICY IF EXISTS "select_own_orders" ON orders;
CREATE POLICY "select_own_orders" ON orders FOR SELECT
TO authenticated USING (auth.uid() = user_id);

-- Orders: authenticated users can insert their own orders
DROP POLICY IF EXISTS "insert_own_orders" ON orders;
CREATE POLICY "insert_own_orders" ON orders FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

-- Orders: authenticated users can update their own orders
DROP POLICY IF EXISTS "update_own_orders" ON orders;
CREATE POLICY "update_own_orders" ON orders FOR UPDATE
TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Orders: authenticated users can delete their own orders
DROP POLICY IF EXISTS "delete_own_orders" ON orders;
CREATE POLICY "delete_own_orders" ON orders FOR DELETE
TO authenticated USING (auth.uid() = user_id);
