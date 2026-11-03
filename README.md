# cyperthief (c1ph3rth3ft)

Game 2D bertema pencuri dan kriptografi. Pemain menjelajahi lima lokasi, meretas terminal dengan mengenkripsi pesan memakai fungsi linear, lalu kabur lewat pintu yang terbuka.

## Cara menjalankan

Buka `index.html` di browser. Tidak perlu instalasi.

## Cara main

1. Buat karakter pencuri (nama samaran dan latar belakang).
2. Jalan di lokasi dengan **W A S D** atau tombol panah (di HP: tombol panah di layar).
3. Dekati terminal (layar hijau) lalu tekan **E** atau tombol "Retas terminal".
4. Enkripsi plaintext: huruf ke angka, terapkan method berurutan, angka ke huruf. Kirim hasilnya sebagai `CYMT{...}`.
5. Flag benar membuka pintu keluar. Jalan ke pintu hijau di dinding atas untuk lanjut.

| Level | Lokasi | Nyawa | Method | Penjaga / kamera |
|---|---|---|---|---|
| 1 | Gudang | 10 | 1 | tidak ada |
| 2 | Rumah | 8 | 2 | 1 penjaga |
| 3 | Hotel | 6 | 3 | 2 penjaga |
| 4 | Laboratorium | 4 | 4 | 2 penjaga, 1 kamera |
| 5 | Gedung Pemerintah | 2 | 5 | 3 penjaga, 1 kamera |

Nyawa hanya berkurang karena flag yang salah (termasuk format salah). Kalau ketahuan penjaga atau kamera, pemain hanya dikembalikan ke titik awal. Nyawa habis berarti ditangkap polisi dan harus membuat karakter baru.

## Struktur file

- `index.html`: semua layar (buat karakter, briefing, dunia 2D, puzzle, menang, penjara, tamat).
- `style.css`: tampilan, animasi error, glitch, dan gaya kanvas.
- `game.js`: aturan game, cipher, puzzle, nyawa, dan animasi.
- `world.js`: dunia 2D top-down di canvas (peta, gerak, penjaga, kamera, terminal, pintu).

## Mengubah isi

- Teks dan flag tiap level: array `LEVELS` di `game.js` (panjang `text` dan `flag` harus sama).
- Peta, penjaga, dan kamera: `MAPS` dan `ENEMIES` di `world.js`.
