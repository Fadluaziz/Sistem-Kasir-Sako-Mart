const express = require('express');
const app = express();
const path = require('path');

// WAJIB: Akses file statis (CSS/Gambar) dan pembaca data form
app.use(express.static(__dirname));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 1. DATABASE SIMULASI
let produkGudang = [
    { id: 1, kode: '001', nama: 'Kopi Sako', harga: 15000, stok: 50 },
    { id: 2, kode: '002', nama: 'Roti Bakar Mart', harga: 12000, stok: 20 },
    { id: 3, kode: '003', nama: 'Susu Segar', harga: 10000, stok: 5 }
];

let pelangganGudang = [
    { id: 1, nama: 'Budi Santoso', telepon: '08123456789', poin: 100 },
    { id: 2, nama: 'Siti Aminah', telepon: '08571234567', poin: 250 }
];

let riwayatTransaksi = [];

// 2. ROUTES HALAMAN (req, res harus urut!)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// 3. API LOGIN
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === '12345') {
        res.json({ success: true });
    } else {
        res.json({ success: false, message: 'ID Pengguna atau Sandi salah!' });
    }
});

// 4. API DATA PRODUK & PELANGGAN
app.get('/api/produk', (req, res) => {
    res.json(produkGudang);
});

app.post('/api/produk', (req, res) => {
    const { nama, harga, stok } = req.body;
    
    // Generate ID & Kode baru
    const newId = produkGudang.length > 0 ? produkGudang[produkGudang.length - 1].id + 1 : 1;
    const newKode = String(newId).padStart(3, '0'); // 001, 002, dst

    const newProduct = {
        id: newId,
        kode: newKode,
        nama: nama,
        harga: parseInt(harga),
        stok: parseInt(stok)
    };

    produkGudang.push(newProduct);
    res.json({ success: true, message: 'Produk berhasil ditambahkan', data: newProduct });
});

app.get('/api/pelanggan', (req, res) => {
    res.json(pelangganGudang);
});

// --- INI KODE BARU YANG LO TAMBAHIN ---
app.post('/api/pelanggan', (req, res) => {
    const { nama, telepon } = req.body;
    const baru = {
        id: pelangganGudang.length + 1,
        nama: nama,
        telepon: telepon,
        poin: 0
    };
    pelangganGudang.push(baru);
    res.json({ success: true, message: 'Member Berhasil Didaftarkan!' });
});
// --------------------------------------

// 5. API TRANSAKSI
app.post('/api/transaksi', (req, res) => {
    const { keranjang, idPelanggan, totalBelanja } = req.body;
    const pelanggan = pelangganGudang.find(p => p.id === parseInt(idPelanggan));
    const namaPembeli = pelanggan ? pelanggan.nama : 'Umum (Bukan Member)';

    if (pelanggan) {
        pelanggan.poin += Math.floor(totalBelanja / 10000);
    }

    keranjang.forEach(item => {
        const produk = produkGudang.find(p => p.kode === item.kode);
        if (produk) produk.stok -= item.jumlah;
    });

    riwayatTransaksi.push({
        id: riwayatTransaksi.length + 1,
        tanggal: new Date().toLocaleString('id-ID'),
        pembeli: namaPembeli,
        total: totalBelanja,
        detail: keranjang
    });

    res.json({ success: true, message: 'Transaksi Berhasil!' });
});

app.get('/api/riwayat', (req, res) => res.json(riwayatTransaksi));

// 6. API STATISTIK DASHBOARD
app.get('/api/stats', (req, res) => {
    // Hitung transaksi hari ini
    const today = new Date().toLocaleDateString('id-ID');
    const transaksiHariIni = riwayatTransaksi.filter(t => 
        t.tanggal.startsWith(today)
    ).length;

    // Hitung stok tipis (<= 5)
    const stokTipis = produkGudang.filter(p => p.stok <= 5).length;

    // Hitung total stok (jumlah fisik semua barang)
    const totalStok = produkGudang.reduce((acc, p) => acc + p.stok, 0);

    res.json({
        totalProduk: produkGudang.length,
        totalStok: totalStok,
        transaksiHariIni: transaksiHariIni,
        stokTipis: stokTipis
    });
});

// JALANKAN SERVER
const PORT = 8080;

app.listen(PORT, '0.0.0.0', () => {
  console.log('Server running on port ' + PORT);
});