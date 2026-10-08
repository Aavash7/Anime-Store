const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Supabase Client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://lohayejsnwpdqjppktrz.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// -------------------------------------------------------------
// 1. API ROUTES (MUST COME BEFORE THE WILDCARD CATCH-ALL ROUTE)
// -------------------------------------------------------------

// GET all items
app.get('/api/items', async (req, res) => {
  try {
    const { data, error } = await supabase.from('items').select('*').order('id', { ascending: true });
    if (error) {
      console.error('Supabase fetch error:', error.message);
      return res.status(500).json({ error: error.message });
    }
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create item
app.post('/api/items', async (req, res) => {
  const { name, price, description, image_url } = req.body;
  try {
    const { data, error } = await supabase
      .from('items')
      .insert([{ name, price, description, image_url }])
      .select();

    if (error) {
      console.error('Supabase insert error:', error.message);
      return res.status(500).json({ error: error.message });
    }
    res.status(201).json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update item
app.put('/api/items/:id', async (req, res) => {
  const { id } = req.params;
  const { name, price, description, image_url } = req.body;
  try {
    const { data, error } = await supabase
      .from('items')
      .update({ name, price, description, image_url })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Supabase update error:', error.message);
      return res.status(500).json({ error: error.message });
    }
    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE item
app.delete('/api/items/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase.from('items').delete().eq('id', id);
    if (error) {
      console.error('Supabase delete error:', error.message);
      return res.status(500).json({ error: error.message });
    }
    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 2. CATCH-ALL ROUTE (MUST BE AT THE VERY BOTTOM OF ALL ROUTES)
// -------------------------------------------------------------
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
const server = app.listen(PORT, () => {
  console.log(`AnimeStore running at http://localhost:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    app.listen(PORT + 1, () => {
      console.log(`AnimeStore running at http://localhost:${PORT + 1}`);
    });
  }
});