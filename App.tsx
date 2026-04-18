import React, { useState, useEffect } from 'react';
import { 
  Menu, X, Home, Info, Users, Newspaper, Phone, 
  MapPin, Mail, ChevronRight, Landmark, ArrowRight,
  LogIn, LogOut, Edit, Trash2, Plus, Image as ImageIcon, Save, Upload, CheckCircle2,
  BookOpen, Target, Map, Building2, ChevronDown, Calendar, BarChart3, PieChart, LayoutDashboard
} from 'lucide-react';

// ================= FIREBASE CLOUD STORAGE SETUP =================
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { initializeFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';

// Deklarasi global agar TypeScript di Vercel tidak error
declare const __firebase_config: any;
declare const __app_id: any;
declare const __initial_auth_token: any;

let app: any = null;
let auth: any = null;
let db: any = null;
let appId = 'desa-upang-mulya'; 

// ================= KONFIGURASI DATABASE MANUAL =================
const firebaseConfigManual = {
  apiKey: "AIzaSyBIl0_tSPDJux9rr2FIL_-ZLZFqLPQ4WCY",
  authDomain: "web-desa-delta-upang.firebaseapp.com",
  projectId: "web-desa-delta-upang",
  storageBucket: "web-desa-delta-upang.firebasestorage.app",
  messagingSenderId: "673276122437",
  appId: "1:673276122437:web:dc2de24a0209f40e6e5a2c",
  measurementId: "G-JLGMKQXVV4"
};

// Mencegah Firebase berjalan saat proses "Build" di server Vercel (SSR)
if (typeof window !== 'undefined') {
  try {
    appId = typeof __app_id !== 'undefined' ? __app_id : 'desa-upang-mulya';
    
    // Prioritaskan config bawaan sistem jika tersedia
    const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : firebaseConfigManual;
    
    if (firebaseConfig && Object.keys(firebaseConfig).length > 0) {
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      db = initializeFirestore(app, { experimentalForceLongPolling: true });
    }
  } catch (err) {
    console.warn("Menjalankan aplikasi dalam mode lokal.");
  }
}

// ================= FUNGSI KOMPRESI GAMBAR OTOMATIS =================
const compressImage = (file: any, maxWidth: any, isLogo: any, callback: any) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = (event: any) => {
    const img = new Image();
    img.src = event.target.result;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        const format = isLogo ? 'image/png' : 'image/jpeg';
        const quality = isLogo ? undefined : 0.4;
        const compressedBase64 = canvas.toDataURL(format, quality);
        callback(compressedBase64);
      } else {
        callback(img.src);
      }
    };
  };
};

// ================= DATA AWAL DEFAULT =================
const initialBerita = [
  {
    id: 1,
    judul: "Penyaluran Bantuan Langsung Tunai (BLT) Dana Desa Tahap III",
    tanggal: "12 Okt 2024",
    kategori: "Sosial",
    gambar: "https://images.unsplash.com/photo-1593113565694-c6f130d24c3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    excerpt: "Pemerintah Desa Upang Mulya kembali menyalurkan Bantuan Langsung Tunai (BLT) yang bersumber dari Dana Desa (DD) kepada keluarga penerima manfaat...\n\n(Teks selengkapnya) Bantuan ini diharapkan dapat meringankan beban ekonomi warga, terutama dalam memenuhi kebutuhan pokok sehari-hari. Kepala Desa menghimbau agar dana tersebut digunakan sebaik-baiknya untuk kebutuhan primer."
  },
  {
    id: 2,
    judul: "Kerja Bakti Bersih Desa Menyambut Musim Penghujan",
    tanggal: "05 Okt 2024",
    kategori: "Kegiatan",
    gambar: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    excerpt: "Mengantisipasi datangnya musim penghujan, warga Desa Upang Mulya bergotong royong membersihkan saluran air dan fasilitas umum guna mencegah banjir...\n\n(Teks selengkapnya) Kegiatan ini diikuti oleh seluruh elemen masyarakat dari 4 Dusun. Selain membersihkan selokan, warga juga melakukan pemangkasan dahan pohon yang rawan tumbang serta membersihkan area pekarangan fasilitas umum."
  },
  {
    id: 3,
    judul: "Pelatihan Pembuatan Pupuk Kompos untuk Kelompok Tani",
    tanggal: "28 Sep 2024",
    kategori: "Pemberdayaan",
    gambar: "https://images.unsplash.com/photo-1592982537447-6f2a6a0a091c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    excerpt: "BUMDes bekerja sama dengan penyuluh pertanian kecamatan mengadakan pelatihan pembuatan pupuk kompos organik yang diikuti oleh 30 petani lokal...\n\n(Teks selengkapnya) Pelatihan ini bertujuan untuk meningkatkan kemandirian petani dalam penyediaan pupuk, menekan biaya produksi pertanian, sekaligus mengedukasi warga tentang pengelolaan limbah organik menjadi barang bernilai ekonomis tinggi."
  }
];

const initialPerangkat = [
  { id: 1, kategori_jabatan: 'KADES', nama: "MURLAWA, SE", jabatan: "KEPALA DESA", foto: "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=400&q=80" },
  { id: 2, kategori_jabatan: 'SEKDES', nama: "MUHADI", jabatan: "PLT SEKRETARIS DESA", foto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80" },
  { id: 3, kategori_jabatan: 'KASI', nama: "SUPARMAN", jabatan: "KEPALA SEKSI PEMERINTAHAN", foto: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80" },
  { id: 4, kategori_jabatan: 'KASI', nama: "NISMA TE'NE", jabatan: "KEPALA SEKSI KESEJAHTERAAN", foto: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80" },
  { id: 5, kategori_jabatan: 'KASI', nama: "LAURA LISTIANI S.E", jabatan: "KEPALA SEKSI PELAYANAN", foto: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80" },
  { id: 6, kategori_jabatan: 'KAUR', nama: "ANDI ADHRYANA AMRAL", jabatan: "KAUR TATA USAHA DAN UMUM", foto: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80" },
  { id: 7, kategori_jabatan: 'KAUR', nama: "MASNADI", jabatan: "KAUR KEUANGAN", foto: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80" },
  { id: 8, kategori_jabatan: 'KAUR', nama: "MUHADI", jabatan: "KAUR PERENCANAAN", foto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80" },
  { id: 9, kategori_jabatan: 'KADUS', nama: "ERMAN", jabatan: "KADUS TRAOTANG", foto: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80" },
  { id: 10, kategori_jabatan: 'KADUS', nama: "SYAMSUDDIN", jabatan: "KADUS BIRAIKI", foto: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80" },
  { id: 11, kategori_jabatan: 'KADUS', nama: "SUGIATI", jabatan: "KADUS PUNGKARUSI", foto: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80" },
  { id: 12, kategori_jabatan: 'KADUS', nama: "MUH. SUKARDI", jabatan: "KADUS LEKKANGLOE", foto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80" }
];

const initialLembaga = [
  { id: 1, kategori: 'bpd', nama: 'Suryadi, S.H.', jabatan: 'Ketua BPD', jenisKelamin: 'Laki-laki', umur: 45, foto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80' },
  { id: 2, kategori: 'pkk', nama: 'Ibu Ratna', jabatan: 'Ketua Tim Penggerak PKK', jenisKelamin: 'Perempuan', umur: 42, foto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80' },
  { id: 3, kategori: 'rt', nama: 'Suharto', jabatan: 'Ketua RT 01', jenisKelamin: 'Laki-laki', umur: 48, foto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80' }
];

const initialProfil = [
  {
    id: 1,
    iconName: "BookOpen",
    judul: "Sejarah",
    gambar: "https://images.unsplash.com/photo-1572005996025-06900f6b6474?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
    konten: "Desa Upang Mulya memiliki sejarah panjang yang mengakar pada nilai-nilai perjuangan dan semangat gotong royong masyarakat pesisir. Sejak awal berdirinya, desa ini terus berkembang menjadi pusat harmoni sosial tempat bertemunya keberagaman budaya yang menyatu dalam kehangatan.\n\nPerjalanan panjang desa ini tidak lepas dari peran serta tetua adat dan tokoh masyarakat yang bahu-membahu membangun peradaban dari tanah yang dulunya terpencil menjadi kawasan yang kian maju dan terbuka terhadap inovasi."
  },
  {
    id: 2,
    iconName: "Target",
    judul: "Visi & Misi",
    gambar: "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
    konten: "VISI KAMI:\n\"Terwujudnya Desa Upang Mulya yang Mandiri, Sejahtera, Religius, dan Berbudaya melalui Tata Kelola Pemerintahan yang Baik dan Inovatif.\"\n\nMISI DESA:\n1. Meningkatkan kualitas pelayanan publik administrasi kependudukan yang cepat, tepat, dan transparan.\n2. Meningkatkan pembangunan infrastruktur jalan, jembatan, dan fasilitas umum desa yang berkualitas dan merata.\n3. Memberdayakan ekonomi kerakyatan dan pertanian melalui optimalisasi BUMDes dan Kelompok Tani.\n4. Meningkatkan kualitas sumber daya manusia melalui dukungan pada sektor pendidikan dan kesehatan dasar.\n5. Melestarikan nilai-nilai gotong royong, budaya lokal, dan kerukunan antar umat beragama."
  },
  {
    id: 3,
    iconName: "Map",
    judul: "Kondisi geografis",
    gambar: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
    konten: "Terletak di bentang alam yang subur dan dialiri oleh perairan sungai yang strategis di Kecamatan Makarti Jaya, Desa Upang Mulya menyimpan potensi agraris dan perikanan yang sangat melimpah.\n\nKondisi topografi dataran rendah dengan curah hujan yang seimbang menjadikan tanah di desa kami sangat cocok untuk pengembangan sektor pertanian unggulan. Suasana pedesaan yang asri, udara yang segar, serta hamparan alam yang masih terjaga menjadikan Upang Mulya tidak hanya makmur secara ekonomi namun juga nyaman untuk ditinggali."
  },
  {
    id: 4,
    iconName: "Building2",
    judul: "Struktur organisasi",
    gambar: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
    konten: "Pemerintahan Desa Upang Mulya didukung oleh struktur organisasi yang tangguh, responsif, dan adaptif terhadap kemajuan zaman. Diisi oleh putra-putri terbaik desa yang berdedikasi tinggi, kami melayani masyarakat dengan sepenuh hati.\n\nSetiap fungsi pemerintahan, mulai dari Kepala Desa, Sekretaris, jajaran Kepala Urusan (Kaur), Kepala Seksi (Kasi), hingga Kepala Dusun, berjalan secara sinergis dengan menjunjung tinggi prinsip transparansi dan profesionalisme demi kemajuan bersama seluruh elemen masyarakat Upang Mulya."
  }
];

const initialBeranda = {
  heroBg: "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
  logoHero: "", 
  headerLogo: "", 
  namaDesa: "Upang Mulya",
  deskripsiDesa: "Kecamatan Makarti Jaya, Kabupaten Banyuasin \nProvinsi Sumatera Selatan",
  fotoKades: "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=400&q=80",
  namaKades: "Murlawa, SE",
  jabatanKades: "Kepala Desa Upang Mulya",
  sambutanKades: "Assalamu'alaikum Warahmatullahi Wabarakatuh. Puji syukur kita panjatkan ke hadirat Allah SWT. Selamat datang di website resmi Desa Upang Mulya. Melalui media ini, kami berupaya mewujudkan transparansi dan kemudahan akses informasi bagi seluruh warga dan masyarakat luas mengenai program kerja, kegiatan, dan pembangunan di desa kita tercinta.",
  stats: [
    { id: 1, num: "3.689", label: "Total Penduduk", subLaki: "1.874", subPerempuan: "1.815" },
    { id: 2, num: "823", label: "Kepala Keluarga" },
    { id: 3, num: "4", label: "Dusun" },
    { id: 4, num: "16", label: "Rukun Tetangga (RT)" }
  ]
};

const initialKeuangan = [
  { id: 1, tahun: '2020', pendapatan: 850, pengeluaran: 810 },
  { id: 2, tahun: '2021', pendapatan: 920, pengeluaran: 890 },
  { id: 3, tahun: '2022', pendapatan: 980, pengeluaran: 950 },
  { id: 4, tahun: '2023', pendapatan: 1100, pengeluaran: 1050 },
  { id: 5, tahun: '2024', pendapatan: 1250, pengeluaran: 1180 }
];

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [isDbConnected, setIsDbConnected] = useState(false); 
  const [dbError, setDbError] = useState("");
  const [currentPage, setCurrentPage] = useState('beranda');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // State Active Tabs
  const [activeProfilTab, setActiveProfilTab] = useState<any>(null);
  const [activePemerintahTab, setActivePemerintahTab] = useState('perangkat');
  
  // States untuk mengatur dropdown
  const [isDesktopProfilOpen, setIsDesktopProfilOpen] = useState(false);
  const [isMobileProfilOpen, setIsMobileProfilOpen] = useState(false);
  const [isDesktopPemerintahOpen, setIsDesktopPemerintahOpen] = useState(false);
  const [isMobilePemerintahOpen, setIsMobilePemerintahOpen] = useState(false);
  const [isDesktopBeritaOpen, setIsDesktopBeritaOpen] = useState(false);
  const [isMobileBeritaOpen, setIsMobileBeritaOpen] = useState(false);
  
  // State Admin
  const [isAdmin, setIsAdmin] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('desa_admin_status') === 'true';
    }
    return false;
  });
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Custom Modal Alert/Confirm
  const [dialog, setDialog] = useState<any>({ isOpen: false, type: 'alert', message: '', onConfirm: null });
  const showAlert = (message: string) => setDialog({ isOpen: true, type: 'alert', message, onConfirm: null });
  const showConfirm = (message: string, onConfirm: any) => setDialog({ isOpen: true, type: 'confirm', message, onConfirm });
  
  // ================= INIT STATE =================
  const getInitialData = (key: string, fallback: any) => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
    }
    return fallback;
  };

  const [daftarBerita, setDaftarBerita] = useState(() => getInitialData('desa_berita_upang', initialBerita));
  const [daftarPerangkat, setDaftarPerangkat] = useState(() => getInitialData('desa_perangkat_upang', initialPerangkat));
  const [daftarLembaga, setDaftarLembaga] = useState(() => getInitialData('desa_lembaga_upang', initialLembaga));
  const [daftarProfil, setDaftarProfil] = useState(() => getInitialData('desa_profil_upang', initialProfil));
  const [dataBeranda, setDataBeranda] = useState(() => getInitialData('desa_beranda_upang', initialBeranda));
  const [dataKeuangan, setDataKeuangan] = useState(() => getInitialData('desa_keuangan_upang', initialKeuangan));

  // ================= MONITORING KONEKSI =================
  useEffect(() => {
    const handleOnline = () => {};
    const handleOffline = () => setIsDbConnected(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsDbConnected(false);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ================= INIT FIREBASE AUTH =================
  useEffect(() => {
    if (!auth) return;
    let isMounted = true;

    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error: any) {
        // Abaikan error konfigurasi agar aplikasi tidak crash
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (isMounted) setUser(currentUser);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // ================= FETCH DATA =================
  useEffect(() => {
    if (!db || !user) return; // CRITICAL: Only fetch if authenticated

    const handleServerData = (snap: any, stateSetter: any, storageKey: string) => {
      setIsDbConnected(true); 
      setDbError(""); 
      if (snap.exists()) {
        const val = snap.data().value;
        const parsedData = typeof val === 'string' ? JSON.parse(val) : val;
        stateSetter(parsedData);
        if (typeof window !== 'undefined') localStorage.setItem(storageKey, JSON.stringify(parsedData));
      }
    };

    const handleServerError = (err: any) => {
      setIsDbConnected(false);
      if (err.code === 'permission-denied') {
        setDbError("Akses Database Ditolak! Anda belum mengubah Rules Firestore menjadi public.");
      }
    };

    const unsubBeranda = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'desa_beranda', 'main'), (snap) => handleServerData(snap, setDataBeranda, 'desa_beranda_upang'), handleServerError);
    const unsubBerita = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'desa_berita', 'main'), (snap) => handleServerData(snap, setDaftarBerita, 'desa_berita_upang'), handleServerError);
    const unsubPerangkat = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'desa_perangkat', 'main'), (snap) => handleServerData(snap, setDaftarPerangkat, 'desa_perangkat_upang'), handleServerError);
    const unsubLembaga = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'desa_lembaga', 'main'), (snap) => handleServerData(snap, setDaftarLembaga, 'desa_lembaga_upang'), handleServerError);
    const unsubProfil = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'desa_profil', 'main'), (snap) => handleServerData(snap, setDaftarProfil, 'desa_profil_upang'), handleServerError);
    const unsubKeuangan = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'desa_keuangan', 'main'), (snap) => handleServerData(snap, setDataKeuangan, 'desa_keuangan_upang'), handleServerError);

    return () => { unsubBeranda(); unsubBerita(); unsubPerangkat(); unsubLembaga(); unsubProfil(); unsubKeuangan(); };
  }, [user]);

  // ================= UPDATE FUNCTIONS =================
  const updateBeranda = async (newData: any) => {
    setDataBeranda(newData);
    if (typeof window !== 'undefined') localStorage.setItem('desa_beranda_upang', JSON.stringify(newData));
    if(db) { try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'desa_beranda', 'main'), { value: JSON.stringify(newData) }); } catch(e) {} }
  };
  const updateBerita = async (newData: any) => {
    setDaftarBerita(newData);
    if (typeof window !== 'undefined') localStorage.setItem('desa_berita_upang', JSON.stringify(newData));
    if(db) { try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'desa_berita', 'main'), { value: JSON.stringify(newData) }); } catch(e) {} }
  };
  const updatePerangkat = async (newData: any) => {
    setDaftarPerangkat(newData);
    if (typeof window !== 'undefined') localStorage.setItem('desa_perangkat_upang', JSON.stringify(newData));
    if(db) { try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'desa_perangkat', 'main'), { value: JSON.stringify(newData) }); } catch(e) {} }
  };
  const updateLembaga = async (newData: any) => {
    setDaftarLembaga(newData);
    if (typeof window !== 'undefined') localStorage.setItem('desa_lembaga_upang', JSON.stringify(newData));
    if(db) { try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'desa_lembaga', 'main'), { value: JSON.stringify(newData) }); } catch(e) {} }
  };
  const updateProfil = async (newData: any) => {
    setDaftarProfil(newData);
    if (typeof window !== 'undefined') localStorage.setItem('desa_profil_upang', JSON.stringify(newData));
    if(db) { try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'desa_profil', 'main'), { value: JSON.stringify(newData) }); } catch(e) {} }
  };
  const updateKeuangan = async (newData: any) => {
    setDataKeuangan(newData);
    if (typeof window !== 'undefined') localStorage.setItem('desa_keuangan_upang', JSON.stringify(newData));
    if(db) { try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'desa_keuangan', 'main'), { value: JSON.stringify(newData) }); } catch(e) {} }
  };

  useEffect(() => {
    const handleOutsideClick = () => {
      setIsDesktopProfilOpen(false);
      setIsDesktopPemerintahOpen(false);
      setIsDesktopBeritaOpen(false);
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  useEffect(() => { 
    if (typeof window !== 'undefined') { window.scrollTo(0, 0); }
  }, [currentPage, activeProfilTab, activePemerintahTab]);

  useEffect(() => { 
    if (typeof window !== 'undefined') { try { localStorage.setItem('desa_admin_status', isAdmin.toString()); } catch(e){} }
  }, [isAdmin]);

  const navigateTo = (page: string, tabId: any = null) => {
    setCurrentPage(page);
    if (page === 'profil' && tabId !== null) setActiveProfilTab(tabId);
    if (page === 'pemerintah' && tabId !== null) setActivePemerintahTab(tabId);

    setIsMobileMenuOpen(false);
    setIsMobileProfilOpen(false);
    setIsDesktopProfilOpen(false);
    setIsMobilePemerintahOpen(false);
    setIsDesktopPemerintahOpen(false);
    setIsDesktopBeritaOpen(false);
    setIsMobileBeritaOpen(false);
  };

  const handleLogin = (e: any) => {
    e.preventDefault();
    const username = e.target.username.value;
    const password = e.target.password.value;
    
    if (username === 'Andiwidodo' && password === 'admin2311') {
      setIsAdmin(true);
      setShowLoginModal(false);
    } else {
      showAlert('Username atau password salah!');
    }
  };

  const handleLogout = () => {
    showConfirm('Yakin ingin keluar dari sesi Admin?', () => setIsAdmin(false));
  };

  const menuPemerintah = [
    { id: 'perangkat', label: 'Struktur Organisasi (SOTK)' },
    { id: 'bpd', label: 'BPD' },
    { id: 'pkk', label: 'PKK' },
    { id: 'rt', label: 'Ketua RT' }
  ];

  const menuBerita = [
    { id: 'berita', label: 'Berita & Informasi', icon: <Newspaper className="w-4 h-4 mr-2" /> },
    { id: 'grafik_keuangan', label: 'Grafik Keuangan Tahunan', icon: <BarChart3 className="w-4 h-4 mr-2" /> },
    { id: 'grafik_penduduk', label: 'Grafik Jumlah Penduduk', icon: <PieChart className="w-4 h-4 mr-2" /> }
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50 text-gray-800 relative selection:bg-emerald-200 selection:text-emerald-900">
      
      {/* Dialog Kustom */}
      {dialog.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 animate-in zoom-in-95 border border-emerald-100">
            <h3 className="text-xl font-extrabold text-gray-900 mb-4 flex items-center">
              <Info className="w-6 h-6 mr-2 text-emerald-600"/>
              {dialog.type === 'confirm' ? 'Konfirmasi' : 'Pemberitahuan'}
            </h3>
            <p className="text-gray-600 mb-8 font-medium">{dialog.message}</p>
            <div className="flex justify-end gap-3">
              {dialog.type === 'confirm' && (
                <button onClick={() => setDialog({ isOpen: false, type: 'alert', message: '', onConfirm: null })} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold transition">Batal</button>
              )}
              <button
                onClick={() => {
                  if (dialog.onConfirm) dialog.onConfirm();
                  setDialog({ isOpen: false, type: 'alert', message: '', onConfirm: null });
                }}
                className={`px-5 py-2.5 text-white rounded-xl font-bold shadow-lg transition bg-emerald-600 hover:bg-emerald-700`}
              >
                {dialog.type === 'confirm' ? 'Ya, Lanjutkan' : 'Tutup'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Styles for Animations */}
      <style>
        {`
          @keyframes float-animation {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-12px); }
          }
          .animate-float {
            animation: float-animation 3.5s ease-in-out infinite;
          }
          @keyframes roll-left {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
          }
          .animate-roll {
            display: inline-block;
            white-space: nowrap;
            animation: roll-left 15s linear infinite;
          }
        `}
      </style>

      {/* Header & Navbar */}
      <header className="bg-gradient-to-r from-emerald-900 to-emerald-800 text-white sticky top-0 z-40 shadow-xl border-b border-emerald-700">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex justify-between items-center py-3">
            {/* Logo */}
            <div 
              className="flex items-center gap-4 cursor-pointer group"
              onClick={() => navigateTo('beranda')}
            >
              <div className="bg-white/10 backdrop-blur-sm p-1.5 rounded-xl border border-white/20 group-hover:bg-white transition duration-300 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center overflow-hidden">
                {dataBeranda.headerLogo ? (
                  <img src={dataBeranda.headerLogo} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Landmark className="h-6 w-6 md:h-7 md:w-7 text-white group-hover:text-emerald-800 transition duration-300" />
                )}
              </div>
              <div className="hidden sm:block">
                <h1 className="text-2xl font-extrabold tracking-tight leading-none drop-shadow-md">Desa Upang Mulya</h1>
                <p className="text-xs text-emerald-200 font-medium mt-1 tracking-wide">Kec. Makarti Jaya, Kab. Banyuasin</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex space-x-1 items-center bg-black/20 p-1.5 rounded-2xl backdrop-blur-md border border-white/10">
              <NavButton active={currentPage === 'beranda'} onClick={() => navigateTo('beranda')} icon={<Home className="w-4 h-4 mr-2" />}>Beranda</NavButton>
              
              {/* Dropdown Profil Desa */}
              <div className="relative" onClick={(e: any) => e.stopPropagation()}>
                <button
                  onClick={() => {
                    setIsDesktopPemerintahOpen(false); setIsDesktopBeritaOpen(false);
                    if (currentPage === 'profil') setIsDesktopProfilOpen(!isDesktopProfilOpen);
                    else { navigateTo('profil', daftarProfil[0]?.id); setIsDesktopProfilOpen(true); }
                  }}
                  className={`px-5 py-2.5 rounded-xl font-bold flex items-center transition-all duration-300 text-sm tracking-wide ${
                    currentPage === 'profil' ? 'bg-white text-emerald-900 shadow-md' : 'text-white hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Info className="w-4 h-4 mr-2" /> Profil Desa <ChevronDown className={`w-4 h-4 ml-1 opacity-70 transition-transform duration-300 ${isDesktopProfilOpen ? 'rotate-180' : ''}`} />
                </button>
                <div className={`absolute top-full left-0 mt-2 w-56 bg-white rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.15)] border border-gray-100 transition-all duration-300 transform origin-top z-50 overflow-hidden ${
                  isDesktopProfilOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-2'
                }`}>
                  <div className="flex flex-col py-1.5">
                    {daftarProfil.map((profil) => (
                      <button
                        key={profil.id}
                        onClick={(e: any) => { e.stopPropagation(); navigateTo('profil', profil.id); }}
                        className={`text-left px-5 py-3 text-sm font-bold transition-all duration-200 relative overflow-hidden ${
                           activeProfilTab === profil.id && currentPage === 'profil' ? 'text-emerald-700 bg-emerald-50/80' : 'text-gray-600 hover:bg-gray-50 hover:text-emerald-600'
                        }`}
                      >
                         {activeProfilTab === profil.id && currentPage === 'profil' && <span className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-emerald-600"></span>}
                         {profil.judul}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dropdown Pemerintah Desa */}
              <div className="relative" onClick={(e: any) => e.stopPropagation()}>
                <button
                  onClick={() => {
                    setIsDesktopProfilOpen(false); setIsDesktopBeritaOpen(false);
                    if (currentPage === 'pemerintah') setIsDesktopPemerintahOpen(!isDesktopPemerintahOpen);
                    else { navigateTo('pemerintah', 'perangkat'); setIsDesktopPemerintahOpen(true); }
                  }}
                  className={`px-5 py-2.5 rounded-xl font-bold flex items-center transition-all duration-300 text-sm tracking-wide ${
                    currentPage === 'pemerintah' ? 'bg-white text-emerald-900 shadow-md' : 'text-white hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4 mr-2" /> Pemerintah Desa <ChevronDown className={`w-4 h-4 ml-1 opacity-70 transition-transform duration-300 ${isDesktopPemerintahOpen ? 'rotate-180' : ''}`} />
                </button>
                <div className={`absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.15)] border border-gray-100 transition-all duration-300 transform origin-top z-50 overflow-hidden ${
                  isDesktopPemerintahOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-2'
                }`}>
                  <div className="flex flex-col py-1.5">
                    {menuPemerintah.map((menu) => (
                      <button
                        key={menu.id}
                        onClick={(e: any) => { e.stopPropagation(); navigateTo('pemerintah', menu.id); }}
                        className={`text-left px-5 py-3 text-sm font-bold transition-all duration-200 relative overflow-hidden ${
                           activePemerintahTab === menu.id && currentPage === 'pemerintah' ? 'text-emerald-700 bg-emerald-50/80' : 'text-gray-600 hover:bg-gray-50 hover:text-emerald-600'
                        }`}
                      >
                         {activePemerintahTab === menu.id && currentPage === 'pemerintah' && <span className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-emerald-600"></span>}
                         {menu.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dropdown Data & Informasi */}
              <div className="relative" onClick={(e: any) => e.stopPropagation()}>
                <button
                  onClick={() => {
                    setIsDesktopProfilOpen(false); setIsDesktopPemerintahOpen(false);
                    if (['berita', 'grafik_keuangan', 'grafik_penduduk'].includes(currentPage)) setIsDesktopBeritaOpen(!isDesktopBeritaOpen);
                    else { navigateTo('berita'); setIsDesktopBeritaOpen(true); }
                  }}
                  className={`px-5 py-2.5 rounded-xl font-bold flex items-center transition-all duration-300 text-sm tracking-wide ${
                    ['berita', 'grafik_keuangan', 'grafik_penduduk'].includes(currentPage) ? 'bg-white text-emerald-900 shadow-md' : 'text-white hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" /> Data & Info <ChevronDown className={`w-4 h-4 ml-1 opacity-70 transition-transform duration-300 ${isDesktopBeritaOpen ? 'rotate-180' : ''}`} />
                </button>
                <div className={`absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.15)] border border-gray-100 transition-all duration-300 transform origin-top z-50 overflow-hidden ${
                  isDesktopBeritaOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-2'
                }`}>
                  <div className="flex flex-col py-1.5">
                    {menuBerita.map((menu) => (
                      <button
                        key={menu.id}
                        onClick={(e: any) => { e.stopPropagation(); navigateTo(menu.id); }}
                        className={`flex items-center text-left px-5 py-3 text-sm font-bold transition-all duration-200 relative overflow-hidden ${
                           currentPage === menu.id ? 'text-emerald-700 bg-emerald-50/80' : 'text-gray-600 hover:bg-gray-50 hover:text-emerald-600'
                        }`}
                      >
                         {menu.icon} {menu.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <NavButton active={currentPage === 'kontak'} onClick={() => navigateTo('kontak')} icon={<Phone className="w-4 h-4 mr-2" />}>Kontak</NavButton>
              
              {/* Tombol Admin Panel */}
              <div className="pl-2 ml-1 border-l border-white/20 flex items-center gap-2">
                {isAdmin ? (
                  <button onClick={handleLogout} className="flex items-center text-sm font-bold bg-rose-500 hover:bg-rose-600 text-white px-5 py-2.5 rounded-xl transition shadow-[0_0_15px_rgba(244,63,94,0.4)]">
                    <LogOut className="w-4 h-4 mr-2" /> Keluar
                  </button>
                ) : (
                  <button onClick={() => setShowLoginModal(true)} className="flex items-center text-sm font-bold bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-xl transition border border-white/10">
                    <LogIn className="w-4 h-4 mr-2" /> Admin
                  </button>
                )}
              </div>
            </nav>

            {/* Mobile Menu Toggle & Admin */}
            <div className="lg:hidden flex items-center gap-2">
               {isAdmin ? (
                  <button onClick={handleLogout} className="p-2.5 bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)] rounded-xl text-white" title="Keluar">
                    <LogOut className="w-5 h-5" />
                  </button>
                ) : (
                  <button onClick={() => setShowLoginModal(true)} className="p-2.5 bg-white/10 border border-white/20 rounded-xl text-white">
                    <LogIn className="w-5 h-5" />
                  </button>
                )}
              <button 
                className="p-2.5 bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/20 transition"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-emerald-950/95 backdrop-blur-xl border-t border-white/10">
            <div className="flex flex-col px-4 pt-2 pb-4 space-y-2">
              <MobileNavButton active={currentPage === 'beranda'} onClick={() => navigateTo('beranda')}>Beranda</MobileNavButton>
              
              <div>
                <button onClick={() => { setIsMobileProfilOpen(!isMobileProfilOpen); setIsMobilePemerintahOpen(false); setIsMobileBeritaOpen(false); }} className={`flex items-center justify-between w-full text-left px-5 py-4 rounded-xl text-lg font-bold transition-all ${currentPage === 'profil' || isMobileProfilOpen ? 'bg-emerald-800 text-white border-l-4 border-emerald-400 shadow-inner' : 'text-emerald-100 hover:bg-emerald-800/80 hover:text-white'}`}>
                  <span>Profil Desa</span> <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isMobileProfilOpen ? 'rotate-180' : ''}`} />
                </button>
                {isMobileProfilOpen && (
                  <div className="flex flex-col bg-emerald-900/50 rounded-xl mt-2 mx-2 overflow-hidden border border-white/5 animate-in slide-in-from-top-2 duration-200">
                    {daftarProfil.map((profil) => (
                      <button key={profil.id} onClick={() => navigateTo('profil', profil.id)} className={`text-left px-6 py-3.5 text-sm font-bold transition-colors border-l-2 ${activeProfilTab === profil.id && currentPage === 'profil' ? 'border-emerald-400 text-white bg-emerald-800/50' : 'border-transparent text-emerald-200 hover:bg-emerald-800 hover:text-white'}`}>
                        {profil.judul}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <button onClick={() => { setIsMobilePemerintahOpen(!isMobilePemerintahOpen); setIsMobileProfilOpen(false); setIsMobileBeritaOpen(false); }} className={`flex items-center justify-between w-full text-left px-5 py-4 rounded-xl text-lg font-bold transition-all ${currentPage === 'pemerintah' || isMobilePemerintahOpen ? 'bg-emerald-800 text-white border-l-4 border-emerald-400 shadow-inner' : 'text-emerald-100 hover:bg-emerald-800/80 hover:text-white'}`}>
                  <span>Pemerintah Desa</span> <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isMobilePemerintahOpen ? 'rotate-180' : ''}`} />
                </button>
                {isMobilePemerintahOpen && (
                  <div className="flex flex-col bg-emerald-900/50 rounded-xl mt-2 mx-2 overflow-hidden border border-white/5 animate-in slide-in-from-top-2 duration-200">
                    {menuPemerintah.map((menu) => (
                      <button key={menu.id} onClick={() => navigateTo('pemerintah', menu.id)} className={`text-left px-6 py-3.5 text-sm font-bold transition-colors border-l-2 ${activePemerintahTab === menu.id && currentPage === 'pemerintah' ? 'border-emerald-400 text-white bg-emerald-800/50' : 'border-transparent text-emerald-200 hover:bg-emerald-800 hover:text-white'}`}>
                        {menu.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <button onClick={() => { setIsMobileBeritaOpen(!isMobileBeritaOpen); setIsMobilePemerintahOpen(false); setIsMobileProfilOpen(false); }} className={`flex items-center justify-between w-full text-left px-5 py-4 rounded-xl text-lg font-bold transition-all ${['berita', 'grafik_keuangan', 'grafik_penduduk'].includes(currentPage) || isMobileBeritaOpen ? 'bg-emerald-800 text-white border-l-4 border-emerald-400 shadow-inner' : 'text-emerald-100 hover:bg-emerald-800/80 hover:text-white'}`}>
                  <span>Data & Informasi</span> <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isMobileBeritaOpen ? 'rotate-180' : ''}`} />
                </button>
                {isMobileBeritaOpen && (
                  <div className="flex flex-col bg-emerald-900/50 rounded-xl mt-2 mx-2 overflow-hidden border border-white/5 animate-in slide-in-from-top-2 duration-200">
                    {menuBerita.map((menu) => (
                      <button key={menu.id} onClick={() => navigateTo(menu.id)} className={`flex items-center text-left px-6 py-3.5 text-sm font-bold transition-colors border-l-2 ${currentPage === menu.id ? 'border-emerald-400 text-white bg-emerald-800/50' : 'border-transparent text-emerald-200 hover:bg-emerald-800 hover:text-white'}`}>
                        {menu.icon} {menu.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <MobileNavButton active={currentPage === 'kontak'} onClick={() => navigateTo('kontak')}>Kontak</MobileNavButton>
            </div>
          </div>
        )}
      </header>

      {/* Pesan Alert Login Admin Aktif */}
      {isAdmin && (
        <div className="bg-emerald-100 text-emerald-800 px-4 py-3 text-sm font-medium text-center shadow-inner flex flex-col items-center justify-center gap-2 z-30 relative">
           <div className="flex items-center gap-2">
             <CheckCircle2 className="w-5 h-5 text-emerald-600" /> 
             <span>Mode Admin Aktif: Anda dapat mengedit konten website.</span>
           </div>
           
           {!isDbConnected && !dbError && (
             <div className="bg-amber-100 text-amber-800 border border-amber-300 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
               ⏳ Menghubungkan ke Server / Mode Offline Sementara...
             </div>
           )}
           {isDbConnected && (
             <div className="bg-emerald-200 text-emerald-800 border border-emerald-400 px-3 py-1 rounded-full text-xs font-bold">
               ✅ Status Database: ONLINE (Tersinkronisasi dengan Server).
             </div>
           )}

           {dbError && (
             <div className="bg-rose-200 text-rose-800 border border-rose-400 px-4 py-2 rounded-xl text-xs font-bold w-full max-w-2xl mt-1 text-left sm:text-center">
               ⚠️ {dbError} <br/>
               <span className="font-normal">Masuk ke <b>Firebase Console</b> Anda, buka menu <b>Firestore Database</b>, klik tab <b>'Rules'</b>, lalu ubah isinya menjadi <br/> <code className="bg-white/50 px-1 rounded">allow read, write: if true;</code> dan klik <b>Publish</b>.</span>
             </div>
           )}
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-grow">
        {currentPage === 'beranda' && (
          <HalamanBeranda navigateTo={navigateTo} isAdmin={isAdmin} dataBeranda={dataBeranda} setDataBeranda={updateBeranda} showAlert={showAlert} daftarBerita={daftarBerita} />
        )}
        {currentPage === 'profil' && (
          <HalamanProfilDesa isAdmin={isAdmin} daftarProfil={daftarProfil} setDaftarProfil={updateProfil} initialTabId={activeProfilTab} navigateTo={navigateTo} showConfirm={showConfirm} />
        )}
        {currentPage === 'pemerintah' && (
          <HalamanPemerintahan isAdmin={isAdmin} activeTab={activePemerintahTab} daftarPerangkat={daftarPerangkat} setDaftarPerangkat={updatePerangkat} daftarLembaga={daftarLembaga} setDaftarLembaga={updateLembaga} showConfirm={showConfirm} />
        )}
        {currentPage === 'berita' && (
          <HalamanBerita isAdmin={isAdmin} daftarBerita={daftarBerita} setDaftarBerita={updateBerita} showConfirm={showConfirm} />
        )}
        {currentPage === 'grafik_keuangan' && (
          <HalamanGrafikKeuangan isAdmin={isAdmin} dataKeuangan={dataKeuangan} setDataKeuangan={updateKeuangan} />
        )}
        {currentPage === 'grafik_penduduk' && (
          <HalamanGrafikPenduduk isAdmin={isAdmin} dataBeranda={dataBeranda} setDataBeranda={updateBeranda} />
        )}
        {currentPage === 'kontak' && (
          <HalamanKontak />
        )}
      </main>

      {/* Footer Elegan */}
      <footer className="bg-gradient-to-b from-gray-900 to-black text-white pt-16 pb-8 border-t-[6px] border-emerald-600">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-emerald-800 p-2.5 rounded-lg shadow-lg shadow-emerald-900/50">
                  <Landmark className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold tracking-tight text-white">Desa Upang Mulya</h3>
              </div>
              <p className="text-gray-400 leading-relaxed mb-6 font-medium">
                Website resmi Pemerintah Desa Upang Mulya, Kecamatan Makarti Jaya, Kabupaten Banyuasin, Sumatera Selatan. Melayani masyarakat dengan transparansi dan inovasi.
              </p>
            </div>
            <div className="md:pl-8">
              <h4 className="text-lg font-bold mb-6 text-white flex items-center">
                <span className="w-8 h-1 bg-emerald-500 rounded-full mr-3"></span> Tautan Cepat
              </h4>
              <ul className="space-y-3">
                <li><button onClick={() => navigateTo('beranda')} className="text-gray-400 hover:text-emerald-400 font-medium flex items-center transition duration-200 hover:translate-x-2"><ChevronRight className="w-4 h-4 mr-2 text-emerald-500"/> Beranda</button></li>
                <li><button onClick={() => navigateTo('profil', daftarProfil[0]?.id)} className="text-gray-400 hover:text-emerald-400 font-medium flex items-center transition duration-200 hover:translate-x-2"><ChevronRight className="w-4 h-4 mr-2 text-emerald-500"/> Profil Desa</button></li>
                <li><button onClick={() => navigateTo('pemerintah', 'perangkat')} className="text-gray-400 hover:text-emerald-400 font-medium flex items-center transition duration-200 hover:translate-x-2"><ChevronRight className="w-4 h-4 mr-2 text-emerald-500"/> Pemerintah Desa</button></li>
                <li><button onClick={() => navigateTo('berita')} className="text-gray-400 hover:text-emerald-400 font-medium flex items-center transition duration-200 hover:translate-x-2"><ChevronRight className="w-4 h-4 mr-2 text-emerald-500"/> Berita & Informasi</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-6 text-white flex items-center">
                <span className="w-8 h-1 bg-emerald-500 rounded-full mr-3"></span> Kontak
              </h4>
              <ul className="space-y-4 text-gray-400 font-medium">
                <li className="flex items-start group">
                  <div className="bg-white/5 p-2 rounded-lg group-hover:bg-emerald-900/50 transition mr-4">
                    <MapPin className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span className="pt-1">Jl. Sunan Kalijaga Dusun II, Kec. Makarti Jaya, Kab. Banyuasin, Sumsel 30972</span>
                </li>
                <li className="flex items-center group">
                  <div className="bg-white/5 p-2 rounded-lg group-hover:bg-emerald-900/50 transition mr-4">
                    <Phone className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span>0822-6876-4585</span>
                </li>
                <li className="flex items-center group">
                  <div className="bg-white/5 p-2 rounded-lg group-hover:bg-emerald-900/50 transition mr-4">
                    <Mail className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span>upangmulya@gmail.com</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center text-gray-500 text-sm font-medium">
            <p>&copy; {new Date().getFullYear()} Pemerintah Desa Upang Mulya. Hak cipta dilindungi.</p>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button Khusus di Halaman Kontak */}
      {currentPage === 'kontak' && (
        <a
          href="https://wa.me/6282268764585"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 md:bottom-8 md:right-8 bg-[#25D366] hover:bg-[#128C7E] text-white p-4 rounded-full shadow-[0_10px_30px_rgba(37,211,102,0.5)] z-50 flex items-center justify-center transition-all duration-300 hover:scale-110 animate-in fade-in slide-in-from-bottom-10 group"
        >
          <svg viewBox="0 0 24 24" className="w-7 h-7 md:w-8 md:h-8 fill-current">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.305-.88-.653-1.473-1.46-1.646-1.757-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
          <span className="absolute right-full mr-4 bg-white text-gray-800 text-sm font-bold px-4 py-2 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap hidden sm:block border border-gray-100">
            Hubungi via WhatsApp
          </span>
        </a>
      )}

      {/* Modal Login Elegan */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 animate-in zoom-in-95 duration-300 border border-emerald-100">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-extrabold text-gray-800 flex items-center tracking-tight">
                <div className="bg-emerald-100 p-2 rounded-xl mr-3">
                  <LogIn className="w-6 h-6 text-emerald-600" />
                </div>
                Login Admin
              </h3>
              <button onClick={() => setShowLoginModal(false)} className="text-gray-400 hover:text-gray-600 bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Username</label>
                <label className="block text-sm font text-gray-500 mb-2">Hubungi admin untuk mendapatkan username dan password</label>
                <input 
                  type="text" name="username" required
                  className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium" 
                  placeholder="Masukkan username"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
                <input 
                  type="password" name="password" required
                  className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium" 
                  placeholder="Masukkan password"
                />
              </div>
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-[0_8px_20px_rgba(5,150,105,0.3)] hover:shadow-[0_8px_25px_rgba(5,150,105,0.4)] hover:-translate-y-0.5 mt-4">
                Masuk ke Dasbor
              </button>
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 mt-4">
                <p className="text-xs text-emerald-800 text-center font-medium">
                  Peringatan! :<br/>Jangan berikan informasi apapun mengenai username dan password kepada pihak yang tidak bertanggung jawab
                </p>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= Komponen Halaman ================= */

function HalamanBeranda({ navigateTo, isAdmin, dataBeranda, setDataBeranda, showAlert, daftarBerita }: any) {
  const [showEditor, setShowEditor] = useState(false);
  const [editForm, setEditForm] = useState(dataBeranda);

  const handleHeroBgChange = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      compressImage(file, 800, false, (base64: any) => { setEditForm((prev: any) => ({ ...prev, heroBg: base64 })); });
      e.target.value = '';
    }
  };

  const handleLogoHeroChange = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      compressImage(file, 300, true, (base64: any) => { setEditForm((prev: any) => ({ ...prev, logoHero: base64 })); });
      e.target.value = '';
    }
  };

  const handleHeaderLogoChange = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      compressImage(file, 200, true, (base64: any) => { setEditForm((prev: any) => ({ ...prev, headerLogo: base64 })); });
      e.target.value = '';
    }
  };

  const handleFotoKadesUpload = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      compressImage(file, 300, false, (base64: any) => { setEditForm((prev: any) => ({ ...prev, fotoKades: base64 })); });
      e.target.value = '';
    }
  };

  const handleStatChange = (id: any, field: any, value: any) => {
    setEditForm((prev: any) => ({
      ...prev, stats: prev.stats.map((s: any) => s.id === id ? { ...s, [field]: value } : s)
    }));
  };

  const handleSave = (e: any) => {
    e.preventDefault();
    setDataBeranda(editForm);
    setShowEditor(false);
    showAlert("Perubahan selesai. Cek hasilnya!");
  };

  const beritaTerbaru = daftarBerita.slice(0, 3); // Ambil 3 berita terbaru

  return (
    <div className="animate-in fade-in duration-700">
      <section className="relative min-h-[100svh] md:min-h-[700px] flex items-center justify-center overflow-hidden py-32 md:py-20">
        <div className="absolute inset-0 z-0">
          <img src={dataBeranda.heroBg} alt="Pemandangan Desa" className="w-full h-full object-cover transition-transform duration-[10s] hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/70 to-transparent"></div>
        </div>

        {isAdmin && (
          <div className="absolute top-6 left-6 z-30 group flex items-center">
             <button onClick={() => { setEditForm(dataBeranda); setShowEditor(true); }} className="cursor-pointer bg-white/90 backdrop-blur hover:bg-white text-emerald-800 p-3.5 rounded-2xl font-bold flex items-center justify-center shadow-[0_8px_30px_rgba(0,0,0,0.3)] transition-all hover:scale-110 border border-white/50">
                <Edit className="w-6 h-6 text-emerald-600" /> 
             </button>
             <div className="absolute left-full ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white text-emerald-800 px-4 py-2 rounded-xl font-bold shadow-lg pointer-events-none whitespace-nowrap">
               Edit Konten Beranda
             </div>
          </div>
        )}
        
        <div className="container mx-auto px-4 lg:px-8 relative z-10 text-center text-white pb-10">
          {dataBeranda.logoHero && (
            <img src={dataBeranda.logoHero} alt="Logo" className="h-28 md:h-36 mx-auto drop-shadow-2xl object-contain animate-float" />
          )}

          <div className="w-full max-w-4xl mx-auto overflow-hidden relative mb-6 mt-4 py-2">
            <div className="animate-roll whitespace-nowrap">
              <span className="text-xl md:text-2xl lg:text-3xl font-black tracking-[0.15em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]">
                Selamat Datang di Website Resmi
              </span>
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight drop-shadow-2xl">
            Desa <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-emerald-100">{dataBeranda.namaDesa}</span>
          </h1>
          <p className="text-lg md:text-2xl text-gray-200 mb-10 max-w-3xl mx-auto font-medium leading-relaxed drop-shadow-lg whitespace-pre-line">
            {dataBeranda.deskripsiDesa}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-5">
            <button onClick={() => navigateTo('profil')} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg py-4 px-10 rounded-2xl shadow-[0_10px_25px_rgba(5,150,105,0.4)] transition-all transform hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(5,150,105,0.5)] border border-emerald-500">
              Profil Desa
            </button>
            <button onClick={() => navigateTo('berita')} className="bg-white hover:bg-gray-50 text-emerald-900 font-bold text-lg py-4 px-10 rounded-2xl shadow-[0_10px_25px_rgba(0,0,0,0.2)] transition-all transform hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(0,0,0,0.3)] border border-transparent">
              Berita Terbaru
            </button>
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" className="fill-gray-50 w-full h-auto">
            <path d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,42.7C1120,32,1280,32,1360,32L1440,32L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"></path>
          </svg>
        </div>
      </section>

      <section className="py-20 bg-gray-50 relative">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-16 flex flex-col md:flex-row items-center gap-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-bl-full -z-10 opacity-50"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-emerald-50 rounded-tr-full -z-10 opacity-50"></div>

            <div className="w-full md:w-1/3 flex justify-center z-10">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-emerald-700 rounded-2xl transform translate-x-4 translate-y-4 group-hover:translate-x-6 group-hover:translate-y-6 transition-transform duration-500 shadow-lg"></div>
                <img 
                  src={dataBeranda.fotoKades} 
                  alt="Foto Kepala Desa" 
                  className="relative rounded-2xl shadow-xl w-64 h-80 object-cover z-10 border-4 border-white"
                  onError={(e: any) => { 
                    if (e.target.src !== 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=400&q=80') {
                      e.target.src = 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=400&q=80';
                    }
                  }}
                />
              </div>
            </div>
            <div className="w-full md:w-2/3 z-10">
              <span className="text-emerald-600 font-bold uppercase tracking-wider text-sm mb-2 block">Sambutan Hangat</span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">Kepala Desa</h2>
              <div className="w-24 h-1.5 bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-full mb-8"></div>
              <p className="text-gray-600 leading-relaxed text-lg mb-8 italic relative whitespace-pre-line">
                <span className="absolute -top-4 -left-4 text-6xl text-emerald-200 opacity-50">"</span>
                {dataBeranda.sambutanKades}
                <span className="absolute -bottom-8 ml-2 text-6xl text-emerald-200 opacity-50">"</span>
              </p>
              <div>
                <div className="font-extrabold text-gray-900 text-2xl mt-4">{dataBeranda.namaKades}</div>
                <div className="text-emerald-600 font-bold mt-1 text-lg">{dataBeranda.jabatanKades}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bagian Berita Terkini & Kalender di Beranda */}
      <section className="py-10 bg-gray-50 relative">
         <div className="container mx-auto px-4 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
               {/* Kiri: Berita Terbaru */}
               <div className="lg:col-span-2 bg-white rounded-3xl shadow-xl border border-gray-100 p-8 flex flex-col h-full">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-extrabold text-2xl text-gray-900 flex items-center">
                      <div className="bg-emerald-100 p-2 rounded-xl mr-3"><Newspaper className="w-6 h-6 text-emerald-600" /></div> Berita Terbaru
                    </h3>
                    <button onClick={() => navigateTo('berita')} className="text-emerald-600 font-bold hover:underline text-sm flex items-center">Lihat Semua <ArrowRight className="w-4 h-4 ml-1"/></button>
                  </div>
                  <div className="space-y-6 flex-grow">
                    {beritaTerbaru.map((b:any) => (
                      <div key={b.id} className="flex flex-col sm:flex-row gap-4 group cursor-pointer border-b border-gray-100 pb-5 last:border-0" onClick={() => navigateTo('berita')}>
                         <img src={b.gambar} className="w-full sm:w-32 h-32 rounded-xl object-cover" alt="Berita"/>
                         <div className="flex flex-col justify-center">
                            <div className="text-xs font-bold text-gray-400 mb-2">{b.tanggal} • {b.kategori}</div>
                            <h4 className="font-bold text-lg text-gray-900 group-hover:text-emerald-600 transition leading-snug line-clamp-2">{b.judul}</h4>
                         </div>
                      </div>
                    ))}
                    {beritaTerbaru.length === 0 && <div className="text-gray-500 italic">Belum ada berita.</div>}
                  </div>
               </div>

               {/* Kanan: Widget Kalender */}
               <div className="lg:col-span-1 h-full">
                 <KalenderWidget />
               </div>
            </div>
         </div>
      </section>

      <section className="py-20 relative bg-emerald-900 overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1592982537447-6f2a6a0a091c?w=1920&q=80')", backgroundSize: 'cover', backgroundPosition: 'center', filter: 'grayscale(100%)' }}></div>
        
        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-8 text-center">
            {dataBeranda.stats.map((stat: any) => (
              <div key={stat.id} className="p-4 sm:p-6 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.1)] hover:bg-white/10 transition-colors flex flex-col justify-center h-full relative overflow-hidden">
                <div className="text-3xl sm:text-5xl font-extrabold text-white mb-1 sm:mb-2 drop-shadow-md">{stat.num}</div>
                <div className="text-emerald-200 font-bold text-xs sm:text-lg tracking-wide">{stat.label}</div>

                {stat.id === 1 && (
                  <div className="flex justify-center gap-2 sm:gap-6 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/10 w-full">
                    <div className="flex flex-col items-center">
                      <span className="font-extrabold text-white text-sm sm:text-xl">{stat.subLaki || "1.650"}</span>
                      <span className="text-[9px] sm:text-[11px] text-emerald-100/90 font-bold uppercase tracking-wider mt-0.5 text-center break-words">Laki-laki</span>
                    </div>
                    <div className="w-px bg-white/20"></div>
                    <div className="flex flex-col items-center">
                      <span className="font-extrabold text-white text-sm sm:text-xl">{stat.subPerempuan || "1.600"}</span>
                      <span className="text-[9px] sm:text-[11px] text-emerald-100/90 font-bold uppercase tracking-wider mt-0.5 text-center break-words">Perempuan</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modal Edit Konten Beranda Khusus Admin */}
      {showEditor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full p-8 max-h-[90vh] overflow-y-auto border border-emerald-100 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="text-2xl font-extrabold text-gray-900 flex items-center">
                <div className="bg-emerald-100 p-2 rounded-xl mr-3">
                   <Home className="w-6 h-6 text-emerald-600" />
                </div>
                Pengaturan Konten Beranda
              </h3>
              <button type="button" onClick={() => setShowEditor(false)} className="text-gray-400 hover:text-gray-600 bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-8">
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                <h4 className="font-extrabold text-lg text-emerald-800 mb-4 flex items-center">
                   <span className="w-6 h-1 bg-emerald-500 rounded-full mr-3"></span> Bagian Hero (Atas)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="col-span-full mb-2">
                    <label className="block text-sm font-bold text-gray-700 mb-3">Gambar Latar Belakang (Hero)</label>
                    <div className="flex items-center gap-5">
                      {editForm.heroBg ? (
                         <img src={editForm.heroBg} alt="Preview Latar" className="w-32 h-20 object-cover rounded-xl shadow-sm border border-gray-200" />
                      ) : (
                         <div className="w-32 h-20 bg-gray-200 rounded-xl flex items-center justify-center border border-gray-300 border-dashed">
                           <ImageIcon className="w-6 h-6 text-gray-400" />
                         </div>
                      )}
                      <div className="flex-1">
                        <label className="cursor-pointer bg-white text-emerald-700 border-2 border-emerald-200 hover:bg-emerald-50 px-5 py-2 rounded-xl font-bold flex items-center justify-center transition-all w-max shadow-sm">
                          <Upload className="w-5 h-5 mr-2" /> Ganti Gambar Latar
                          <input type="file" accept="image/*" className="hidden" onChange={handleHeroBgChange} />
                        </label>
                        <p className="text-sm text-gray-500 mt-2 font-medium">Gambar pemandangan untuk latar atas. Otomatis dikompres.</p>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-full mb-2">
                    <label className="block text-sm font-bold text-gray-700 mb-3">Logo Navigasi Header (Pojok Kiri Atas)</label>
                    <div className="flex items-center gap-5">
                      {editForm.headerLogo ? (
                         <img src={editForm.headerLogo} alt="Preview Logo Header" className="w-16 h-16 object-contain bg-emerald-900 rounded-xl shadow-sm border border-emerald-800 p-2" />
                      ) : (
                         <div className="w-16 h-16 bg-gray-200 rounded-xl flex items-center justify-center border border-gray-300 border-dashed">
                           <Landmark className="w-6 h-6 text-gray-400" />
                         </div>
                      )}
                      <div className="flex-1">
                        <label className="cursor-pointer bg-white text-emerald-700 border-2 border-emerald-200 hover:bg-emerald-50 px-5 py-2 rounded-xl font-bold flex items-center justify-center transition-all w-max shadow-sm">
                          <Upload className="w-5 h-5 mr-2" /> {editForm.headerLogo ? 'Ganti Logo Header' : 'Upload Logo Header'}
                          <input type="file" accept="image/*" className="hidden" onChange={handleHeaderLogoChange} />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-full">
                    <label className="block text-sm font-bold text-gray-700 mb-3">Logo Teks Hero (Bagian Tengah)</label>
                    <div className="flex items-center gap-5">
                      {editForm.logoHero ? (
                         <img src={editForm.logoHero} alt="Preview Logo Hero" className="w-24 h-24 object-contain bg-gray-200 rounded-xl shadow-sm border border-gray-300 p-2" />
                      ) : (
                         <div className="w-24 h-24 bg-gray-200 rounded-xl flex items-center justify-center border border-gray-300 border-dashed">
                           <ImageIcon className="w-6 h-6 text-gray-400" />
                         </div>
                      )}
                      <div className="flex-1">
                        <label className="cursor-pointer bg-white text-emerald-700 border-2 border-emerald-200 hover:bg-emerald-50 px-5 py-2 rounded-xl font-bold flex items-center justify-center transition-all w-max shadow-sm">
                          <Upload className="w-5 h-5 mr-2" /> {editForm.logoHero ? 'Ganti Logo Hero' : 'Upload Logo Hero'}
                          <input type="file" accept="image/*" className="hidden" onChange={handleLogoHeroChange} />
                        </label>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Nama Desa</label>
                    <input type="text" required value={editForm.namaDesa} onChange={(e) => setEditForm({...editForm, namaDesa: e.target.value})} className="w-full px-5 py-3 bg-white border border-gray-300 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium" />
                  </div>
                  <div className="col-span-full">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Deskripsi / Sub-judul (Gunakan Enter untuk baris baru)</label>
                    <textarea required rows={3} value={editForm.deskripsiDesa} onChange={(e) => setEditForm({...editForm, deskripsiDesa: e.target.value})} className="w-full px-5 py-3 bg-white border border-gray-300 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium leading-relaxed"></textarea>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                <h4 className="font-extrabold text-lg text-emerald-800 mb-4 flex items-center">
                   <span className="w-6 h-1 bg-emerald-500 rounded-full mr-3"></span> Bagian Sambutan
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Nama Lengkap Kepala Desa</label>
                    <input type="text" required value={editForm.namaKades} onChange={(e) => setEditForm({...editForm, namaKades: e.target.value})} className="w-full px-5 py-3 bg-white border border-gray-300 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Jabatan (Teks)</label>
                    <input type="text" required value={editForm.jabatanKades} onChange={(e) => setEditForm({...editForm, jabatanKades: e.target.value})} className="w-full px-5 py-3 bg-white border border-gray-300 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium" />
                  </div>
                  <div className="col-span-full">
                    <label className="block text-sm font-bold text-gray-700 mb-3">Foto Kepala Desa</label>
                    <div className="flex items-center gap-5">
                      <img src={editForm.fotoKades} alt="Preview Kades" className="w-24 h-24 object-cover rounded-xl shadow-sm border border-gray-300" />
                      <div className="flex-1">
                        <label className="cursor-pointer bg-white text-emerald-700 border-2 border-emerald-200 hover:bg-emerald-50 px-5 py-2 rounded-xl font-bold flex items-center justify-center transition-all w-max shadow-sm">
                          <Upload className="w-5 h-5 mr-2" /> Ganti Foto
                          <input type="file" accept="image/*" className="hidden" onChange={handleFotoKadesUpload} />
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-full">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Isi Pesan Sambutan</label>
                    <textarea required rows={6} value={editForm.sambutanKades} onChange={(e) => setEditForm({...editForm, sambutanKades: e.target.value})} className="w-full px-5 py-3 bg-white border border-gray-300 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium leading-relaxed"></textarea>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                <h4 className="font-extrabold text-lg text-emerald-800 mb-4 flex items-center">
                   <span className="w-6 h-1 bg-emerald-500 rounded-full mr-3"></span> Pengaturan Angka Statistik Dasar
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {editForm.stats.map((stat: any, index: number) => (
                    <div key={stat.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-3">
                      <div className="font-bold text-gray-500 text-sm border-b pb-1">Kolom {index + 1}</div>
                      <div>
                         <label className="block text-xs font-bold text-gray-700 mb-1">Angka / Jumlah</label>
                         <input type="text" required value={stat.num} onChange={(e) => handleStatChange(stat.id, 'num', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
                      </div>
                      <div>
                         <label className="block text-xs font-bold text-gray-700 mb-1">Label (Contoh: Total Penduduk)</label>
                         <input type="text" required value={stat.label} onChange={(e) => handleStatChange(stat.id, 'label', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
                      </div>
                      {stat.id === 1 && (
                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100 mt-1">
                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Laki-laki</label>
                            <input type="text" required value={stat.subLaki || ''} onChange={(e) => handleStatChange(stat.id, 'subLaki', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Perempuan</label>
                            <input type="text" required value={stat.subPerempuan || ''} onChange={(e) => handleStatChange(stat.id, 'subPerempuan', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end gap-4 pt-6 sticky bottom-0 bg-white p-4 -mx-8 -mb-8 rounded-b-3xl">
                <button type="button" onClick={() => setShowEditor(false)} className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold transition-colors">Batal</button>
                <button type="submit" className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center transition-all shadow-[0_8px_20px_rgba(5,150,105,0.3)] hover:shadow-[0_10px_25px_rgba(5,150,105,0.4)] hover:-translate-y-0.5">
                  <Save className="w-5 h-5 mr-2" /> Simpan Perubahan Beranda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ============== KOMPONEN PROFIL DESA ==============
function HalamanProfilDesa({ isAdmin, daftarProfil, setDaftarProfil, initialTabId, navigateTo, showConfirm }: any) {
  const [activeTabId, setActiveTabId] = useState<any>(initialTabId || daftarProfil[0]?.id);
  const [showEditor, setShowEditor] = useState(false);
  const [editData, setEditData] = useState<any>(null);

  useEffect(() => {
    if (initialTabId) {
      setActiveTabId(initialTabId);
    } else if (daftarProfil.length > 0 && !daftarProfil.find((p: any) => p.id === activeTabId)) {
      setActiveTabId(daftarProfil[0].id);
    }
  }, [initialTabId, daftarProfil, activeTabId]);

  const activeProfil = daftarProfil.find((p: any) => p.id === activeTabId);

  const handleDelete = (id: any) => {
    showConfirm('Yakin ingin menghapus bagian profil ini?', () => {
      setDaftarProfil(daftarProfil.filter((p: any) => p.id !== id));
    });
  };

  const openEditor = (profil: any = null) => {
    if (profil) {
      setEditData(profil);
    } else {
      setEditData({ id: null, iconName: 'BookOpen', judul: '', konten: '', gambar: '' });
    }
    setShowEditor(true);
  };

  const handleSave = (e: any) => {
    e.preventDefault();
    if (editData.id) {
      setDaftarProfil(daftarProfil.map((p: any) => p.id === editData.id ? editData : p));
    } else {
      const newProfil = { ...editData, id: Date.now() };
      setDaftarProfil([...daftarProfil, newProfil]);
      setActiveTabId(newProfil.id); 
    }
    setShowEditor(false);
  };

  const handleImageUpload = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      compressImage(file, 1200, false, (base64: any) => {
        setEditData({ ...editData, gambar: base64 });
      });
      e.target.value = '';
    }
  };

  const renderIcon = (iconName: string, className: string) => {
    switch (iconName) {
      case 'Target': return <Target className={className} />;
      case 'Map': return <Map className={className} />;
      case 'Building2': return <Building2 className={className} />;
      case 'BookOpen':
      default: return <BookOpen className={className} />;
    }
  };

  const isVisiMisi = activeProfil && activeProfil.judul.toLowerCase().includes('visi');
  let visiText = "";
  let misiList: string[] = [];

  if (isVisiMisi && activeProfil) {
    const text = activeProfil.konten;
    const misiIndex = text.toUpperCase().indexOf('MISI');
    
    if (misiIndex !== -1) {
        visiText = text.substring(0, misiIndex).replace(/VISI KAMI:/i, '').replace(/"/g, '').trim();
        const rawMisiText = text.substring(misiIndex);
        const cleanMisiText = rawMisiText.replace(/^MISI( DESA)?:\s*/i, '');
        misiList = cleanMisiText.split('\n').map((m: string) => m.replace(/^\d+[\.\)]\s*/, '').trim()).filter((m: string) => m);
    } else {
        visiText = text;
    }
  }

  return (
    <div className="animate-in fade-in zoom-in-95 duration-500 py-16 bg-gray-50 min-h-[70vh]">
      <div className="container mx-auto px-4 lg:px-8 flex flex-col items-center justify-center">
        
        <div className="text-center mb-10 w-full max-w-4xl mx-auto">
          <span className="text-emerald-600 font-bold tracking-widest uppercase text-sm mb-2 block">Informasi Publik</span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">Profil Desa</h2>
          <div className="w-24 h-1.5 bg-gradient-to-r from-emerald-600 to-emerald-400 mx-auto rounded-full"></div>
          <p className="mt-6 text-gray-600 text-lg leading-relaxed">
            Mengenal lebih dekat sejarah, visi misi, letak geografis, dan struktur organisasi Pemerintah Desa.
          </p>
        </div>

        {isAdmin && (
          <div className="w-full max-w-5xl mb-6 flex justify-end">
            <button onClick={() => openEditor()} className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center transition-all">
              <Plus className="w-5 h-5 mr-2" /> Tambah Bagian Profil
            </button>
          </div>
        )}

        <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden relative min-h-[500px] flex flex-col mx-auto">
          {activeProfil ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex-grow flex flex-col">
              
              {isAdmin && (
                <div className="absolute top-4 right-4 z-20 flex gap-2">
                  <button onClick={() => openEditor(activeProfil)} className="bg-amber-500 hover:bg-amber-600 text-white p-2.5 rounded-xl shadow-lg transition">
                    <Edit className="w-5 h-5" />
                  </button>
                  <button onClick={() => handleDelete(activeProfil.id)} className="bg-rose-500 hover:bg-rose-600 text-white p-2.5 rounded-xl shadow-lg transition">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              )}

              {activeProfil.gambar && (
                <div className="relative w-full h-64 md:h-96 overflow-hidden bg-gray-100 flex-shrink-0">
                  <img 
                    src={activeProfil.gambar} 
                    alt={activeProfil.judul} 
                    className="w-full h-full object-cover"
                    onError={(e: any) => {
                      if (e.target.src !== 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200&q=80') {
                        e.target.src = 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200&q=80';
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/30 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full">
                      <div className="flex items-center gap-3 text-emerald-300 mb-3">
                        {renderIcon(activeProfil.iconName, "w-6 h-6")}
                        <span className="font-bold tracking-widest uppercase text-sm">Bagian Profil</span>
                      </div>
                      <h3 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-md">
                        {activeProfil.judul}
                      </h3>
                  </div>
                </div>
              )}

              <div className={`p-6 md:p-12 flex-grow flex flex-col ${!activeProfil.gambar ? 'pt-16 md:pt-20' : ''}`}>
                {!activeProfil.gambar && (
                   <div className="mb-10 text-center">
                     <div className="inline-flex justify-center items-center bg-emerald-100 text-emerald-600 p-4 rounded-2xl mb-6 shadow-sm">
                       {renderIcon(activeProfil.iconName, "w-10 h-10")}
                     </div>
                     <h3 className="text-3xl md:text-5xl font-extrabold text-emerald-900 tracking-tight">
                       {activeProfil.judul}
                     </h3>
                   </div>
                )}
                
                <div className="flex-grow max-w-4xl mx-auto w-full">
                  {isVisiMisi ? (
                    <div className="space-y-12">
                      <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 rounded-3xl shadow-2xl p-8 md:p-14 text-center transform hover:scale-[1.02] transition-transform duration-300">
                        <h3 className="text-2xl font-extrabold text-white mb-6 tracking-widest">VISI KAMI</h3>
                        <p className="text-xl md:text-3xl text-emerald-50 font-medium leading-tight italic drop-shadow-md">
                          "{visiText}"
                        </p>
                      </div>

                      <div className="bg-white rounded-3xl shadow-xl p-8 md:p-14 border border-gray-100 relative overflow-hidden">
                         <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-[100px] -z-10"></div>
                        <h3 className="text-2xl md:text-3xl font-extrabold text-emerald-900 mb-8 text-center tracking-widest">MISI DESA</h3>
                        <div className="space-y-5">
                          {misiList.map((misi, index) => (
                            <div key={index} className="flex items-start bg-gray-50 hover:bg-emerald-50 p-5 md:p-6 rounded-2xl transition-colors duration-300 border border-gray-100 hover:border-emerald-200">
                              <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center font-black text-lg md:text-xl mr-4 md:mr-5 shadow-sm">
                                {index + 1}
                              </div>
                              <p className="text-gray-700 text-base md:text-xl font-medium pt-1 md:pt-1.5 leading-relaxed">{misi}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-700 text-lg md:text-xl leading-relaxed whitespace-pre-wrap font-medium">
                      {activeProfil.konten}
                    </div>
                  )}
                </div>

                <div className="mt-16 pt-8 border-t border-gray-100 flex justify-end w-full max-w-4xl mx-auto">
                  <button onClick={() => navigateTo('beranda')} className="flex items-center text-sm md:text-base font-bold text-gray-500 hover:text-emerald-700 bg-gray-50 hover:bg-emerald-50 px-6 py-3.5 rounded-xl border border-gray-200 hover:border-emerald-200 transition-all shadow-sm hover:shadow-md">
                    <ArrowRight className="w-5 h-5 mr-2 rotate-180" /> Kembali ke Halaman Utama
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-16 text-center h-full flex flex-col items-center justify-center text-gray-400">
              <Info className="w-16 h-16 mb-4 text-gray-300" />
              <p className="text-xl font-medium">Data profil belum tersedia.</p>
            </div>
          )}
        </div>
      </div>

      {/* Admin Profil Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full p-8 max-h-[90vh] overflow-y-auto border border-emerald-100 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="text-2xl font-extrabold text-gray-900 flex items-center">
                <div className="bg-emerald-100 p-2 rounded-xl mr-3">
                   <Info className="w-6 h-6 text-emerald-600" />
                </div>
                {editData.id ? 'Edit Bagian Profil' : 'Tambah Bagian Profil Baru'}
              </h3>
              <button type="button" onClick={() => setShowEditor(false)} className="text-gray-400 hover:text-gray-600 bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Judul Tab / Menu</label>
                  <input type="text" required value={editData.judul} onChange={(e) => setEditData({...editData, judul: e.target.value})} placeholder="Contoh: Sejarah Desa" className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Pilih Ikon</label>
                  <div className="relative">
                    <select required value={editData.iconName} onChange={(e) => setEditData({...editData, iconName: e.target.value})} className="w-full px-5 py-3 pl-12 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium appearance-none">
                      <option value="BookOpen">Buku (Sejarah/Cerita)</option>
                      <option value="Target">Target (Visi/Misi)</option>
                      <option value="Map">Peta (Geografis/Lokasi)</option>
                      <option value="Building2">Gedung (Struktur/Organisasi)</option>
                      <option value="Info">Info (Umum)</option>
                    </select>
                    <div className="absolute left-4 top-3.5 text-emerald-600 pointer-events-none">{renderIcon(editData.iconName, "w-5 h-5")}</div>
                    <ChevronDown className="absolute right-4 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div className="col-span-full">
                  <label className="block text-sm font-bold text-gray-700 mb-3">Gambar Latar Header (Opsional)</label>
                  <div className="flex items-center gap-5 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                    {editData.gambar ? (
                      <img src={editData.gambar} alt="Preview" className="w-32 h-20 object-cover rounded-xl shadow-sm border border-gray-200" />
                    ) : (
                      <div className="w-32 h-20 bg-gray-200 rounded-xl flex items-center justify-center border border-gray-300 border-dashed">
                        <ImageIcon className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <label className="cursor-pointer bg-white text-emerald-700 border-2 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 px-5 py-3 rounded-xl font-bold flex items-center justify-center transition-all shadow-sm w-max">
                        <Upload className="w-5 h-5 mr-2" /> Upload Gambar Header
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      </label>
                      <p className="text-sm text-gray-500 mt-2 font-medium">Gambar akan tampil cantik di atas teks.</p>
                    </div>
                  </div>
                </div>

                <div className="col-span-full">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Isi Paragraf Profil (Gunakan enter untuk baris baru)</label>
                  <textarea required rows={10} value={editData.konten} onChange={(e) => setEditData({...editData, konten: e.target.value})} placeholder="Ketikkan isi informasi di sini secara menarik dan meyakinkan..." className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium leading-relaxed" ></textarea>
                </div>
              </div>
              
              <div className="flex justify-end gap-4 pt-6 sticky bottom-0 bg-white p-4 -mx-8 -mb-8 rounded-b-3xl">
                <button type="button" onClick={() => setShowEditor(false)} className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold transition-colors">Batal</button>
                <button type="submit" className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center transition-all shadow-[0_8px_20px_rgba(5,150,105,0.3)] hover:shadow-[0_10px_25px_rgba(5,150,105,0.4)] hover:-translate-y-0.5">
                  <Save className="w-5 h-5 mr-2" /> Simpan Profil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ============== HALAMAN PEMERINTAHAN ==============
function HalamanPemerintahan({ isAdmin, activeTab, daftarPerangkat, setDaftarPerangkat, daftarLembaga, setDaftarLembaga, showConfirm }: any) {
  const isPerangkat = activeTab === 'perangkat' || !activeTab;
  
  const [showEditorPerangkat, setShowEditorPerangkat] = useState(false);
  const [editDataPerangkat, setEditDataPerangkat] = useState<any>(null);

  const [showEditorLembaga, setShowEditorLembaga] = useState(false);
  const [editDataLembaga, setEditDataLembaga] = useState<any>(null);

  const getTabTitle = (tabId: string) => {
    switch(tabId) {
      case 'bpd': return 'Badan Permusyawaratan Desa (BPD)';
      case 'pkk': return 'Pemberdayaan Kesejahteraan Keluarga (PKK)';
      case 'kadus': return 'Daftar Kepala Dusun';
      case 'rt': return 'Daftar Ketua RT';
      default: return 'Struktur Organisasi';
    }
  };

  const getTabSubtitle = (tabId: string) => {
    switch(tabId) {
      case 'bpd': return 'Daftar anggota BPD yang bertugas menyalurkan aspirasi masyarakat.';
      case 'pkk': return 'Tim Penggerak PKK yang berfokus pada pemberdayaan dan kesejahteraan keluarga.';
      case 'kadus': return 'Daftar perangkat kewilayahan yang bertugas membantu Kepala Desa di wilayah Dusun.';
      case 'rt': return 'Daftar Ketua Rukun Tetangga (RT) yang menjadi ujung tombak pelayanan masyarakat.';
      default: return 'Struktur Organisasi dan Tata Kerja (SOTK) Pemerintah Desa Upang Mulya.';
    }
  };

  // ----- LOGIC SOTK -----
  const openEditorPerangkat = (perangkat: any = null) => {
    if (perangkat) setEditDataPerangkat(perangkat);
    else setEditDataPerangkat({ id: null, nama: '', jabatan: '', foto: '', kategori_jabatan: 'KASI' });
    setShowEditorPerangkat(true);
  };
  const handleSavePerangkat = (e: any) => {
    e.preventDefault();
    if (editDataPerangkat.id) setDaftarPerangkat(daftarPerangkat.map((p: any) => p.id === editDataPerangkat.id ? editDataPerangkat : p));
    else setDaftarPerangkat([...daftarPerangkat, { ...editDataPerangkat, id: Date.now() }]);
    setShowEditorPerangkat(false);
  };
  const handleImageUploadPerangkat = (e: any) => {
    const file = e.target.files[0];
    if (file) compressImage(file, 300, false, (base64: any) => setEditDataPerangkat({ ...editDataPerangkat, foto: base64 }));
  };

  // Komponen Card Org Chart
  const OrgCard = ({ data }: { data: any }) => {
    const isKosong = !data || data.jabatan === 'KOSONG';
    return (
      <div className="flex flex-col items-center bg-white border border-[#0284c7] w-[160px] h-[135px] shadow-sm group relative">
        {!isKosong && isAdmin && (
          <div className="absolute -top-10 -right-2 z-20 hidden group-hover:flex gap-1 bg-white p-1 rounded-lg shadow-lg border">
            <button onClick={() => openEditorPerangkat(data)} className="p-1 text-amber-500 hover:bg-amber-50 rounded"><Edit className="w-4 h-4"/></button>
            <button onClick={() => showConfirm('Hapus perangkat?', ()=> setDaftarPerangkat(daftarPerangkat.filter((p:any)=>p.id!==data.id)))} className="p-1 text-rose-500 hover:bg-rose-50 rounded"><Trash2 className="w-4 h-4"/></button>
          </div>
        )}
        <div className="bg-[#0284c7] text-white font-bold text-[9px] w-full text-center py-1 px-1 uppercase min-h-[32px] flex items-center justify-center leading-tight">
           {data?.jabatan || 'KOSONG'}
        </div>
        <div className="p-2 pb-0">
          <div className="w-[50px] h-[50px] rounded-full overflow-hidden border border-gray-200 mx-auto bg-gray-100">
             <img src={data?.foto || "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=100&q=80"} alt={data?.nama} className="w-full h-full object-cover"/>
          </div>
        </div>
        <div className="font-extrabold text-[10px] text-gray-800 text-center uppercase px-2 mt-2 break-words w-full line-clamp-2 leading-tight">
          {data?.nama || '-'}
        </div>
      </div>
    );
  };

  // Garis Penghubung Absolut (Agar presisi seperti screenshot)
  const AbsLine = ({ top, left, w, h, arrow }: any) => (
    <div className="absolute bg-[#0284c7] z-0" style={{ top: `${top}px`, left: `${left}px`, width: `${w}px`, height: `${h}px` }}>
       {arrow && <div className="absolute -bottom-[2px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[7px] border-t-[#0284c7]"></div>}
    </div>
  );

  const AbsoluteCard = ({ data, left, top }: { data: any, left: number, top: number }) => (
     <div className="absolute z-10" style={{ left: `${left}px`, top: `${top}px` }}>
        <OrgCard data={data} />
     </div>
  );

  // Filter Data Perangkat berdasarkan posisi dari screenshot
  const kades = daftarPerangkat.find((p:any) => p.kategori_jabatan === 'KADES');
  const sekdes = daftarPerangkat.find((p:any) => p.kategori_jabatan === 'SEKDES');
  const kesis = daftarPerangkat.filter((p:any) => p.kategori_jabatan === 'KASI');
  const kaurs = daftarPerangkat.filter((p:any) => p.kategori_jabatan === 'KAUR');
  const kaduses = daftarPerangkat.filter((p:any) => p.kategori_jabatan === 'KADUS');

  // ----- LOGIC LEMBAGA -----
  const filteredLembaga = daftarLembaga.filter((l: any) => l.kategori === activeTab);
  const openEditorLembaga = (lembaga: any = null) => {
    if (lembaga) setEditDataLembaga(lembaga);
    else setEditDataLembaga({ id: null, kategori: activeTab, nama: '', jabatan: '', jenisKelamin: 'Laki-laki', umur: '', foto: '' });
    setShowEditorLembaga(true);
  };
  const handleSaveLembaga = (e: any) => {
    e.preventDefault();
    if (editDataLembaga.id) setDaftarLembaga(daftarLembaga.map((l: any) => l.id === editDataLembaga.id ? editDataLembaga : l));
    else setDaftarLembaga([...daftarLembaga, { ...editDataLembaga, id: Date.now() }]);
    setShowEditorLembaga(false);
  };
  const handleImageUploadLembaga = (e: any) => {
    const file = e.target.files[0];
    if (file) compressImage(file, 200, false, (base64: any) => setEditDataLembaga({ ...editDataLembaga, foto: base64 }));
  };

  return (
    <div className="animate-in fade-in py-16 bg-gray-50 min-h-[70vh]">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#0284c7] mb-2 tracking-tight uppercase">
             {getTabTitle(activeTab)}
          </h2>
          <h3 className="text-xl md:text-2xl font-bold text-[#0284c7] uppercase">Pemerintah Desa Upang Mulya</h3>
          <div className="w-24 h-1.5 bg-gradient-to-r from-sky-600 to-sky-400 mx-auto rounded-full mt-6"></div>
        </div>

        {/* =========== TAMPILAN PERANGKAT DESA (ORG CHART ABSOLUTE KORDINAT) =========== */}
        {isPerangkat && (
          <div className="w-full overflow-x-auto pb-10 bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
             {isAdmin && (
              <div className="mb-8 flex justify-center">
                <button onClick={() => openEditorPerangkat()} className="bg-[#0284c7] hover:bg-sky-700 text-white font-extrabold py-3 px-8 rounded-xl shadow-lg flex items-center transition-all">
                  <Plus className="w-5 h-5 mr-2" /> Tambah Posisi Struktur
                </button>
              </div>
             )}

             {/* Area Kordinat Fix untuk Mencegah Tabrakan Garis/Kotak */}
             <div className="min-w-[1100px] h-[740px] relative mx-auto bg-white overflow-hidden">
                {/* KADES */}
                <AbsoluteCard data={kades} left={470} top={0} />

                {/* GARIS VERTIKAL UTAMA (Di bawah Kades) */}
                <AbsLine left={549} top={135} w={2} h={415} />

                {/* GARIS KE SEKDES (Cabang Kanan) */}
                <AbsLine left={550} top={155} w={300} h={2} /> {/* Horizontal ke kanan */}
                <AbsLine left={849} top={155} w={2} h={15} arrow /> {/* Turun ke Sekdes */}
                <AbsoluteCard data={sekdes} left={770} top={170} />

                {/* GARIS KE KASI (Cabang Kiri) */}
                <AbsLine left={150} top={350} w={400} h={2} /> {/* Horizontal kiri dari tengah */}
                <AbsLine left={149} top={350} w={2} h={20} arrow /> {/* Drop Kasi 1 */}
                <AbsLine left={349} top={350} w={2} h={20} arrow /> {/* Drop Kasi 2 */}
                <AbsLine left={549} top={350} w={2} h={20} arrow /> {/* Drop Kasi 3 */}
                <AbsoluteCard data={kesis[0]} left={70} top={370} />
                <AbsoluteCard data={kesis[1]} left={270} top={370} />
                <AbsoluteCard data={kesis[2]} left={470} top={370} />

                {/* GARIS KE KAUR (Cabang di bawah Sekdes) */}
                <AbsLine left={849} top={305} w={2} h={45} /> {/* Turun dari Sekdes */}
                <AbsLine left={650} top={350} w={400} h={2} /> {/* Horizontal Kaur */}
                <AbsLine left={649} top={350} w={2} h={20} arrow /> {/* Drop Kaur 1 */}
                <AbsLine left={849} top={350} w={2} h={20} arrow /> {/* Drop Kaur 2 */}
                <AbsLine left={1049} top={350} w={2} h={20} arrow /> {/* Drop Kaur 3 */}
                <AbsoluteCard data={kaurs[0]} left={570} top={370} />
                <AbsoluteCard data={kaurs[1]} left={770} top={370} />
                <AbsoluteCard data={kaurs[2]} left={970} top={370} />

                {/* GARIS KE KADUS (Paling Bawah) */}
                <AbsLine left={250} top={550} w={600} h={2} /> {/* Horizontal Kadus */}
                <AbsLine left={249} top={550} w={2} h={20} arrow /> {/* Drop Kadus 1 */}
                <AbsLine left={449} top={550} w={2} h={20} arrow /> {/* Drop Kadus 2 */}
                <AbsLine left={649} top={550} w={2} h={20} arrow /> {/* Drop Kadus 3 */}
                <AbsLine left={849} top={550} w={2} h={20} arrow /> {/* Drop Kadus 4 */}
                <AbsoluteCard data={kaduses[0]} left={170} top={570} />
                <AbsoluteCard data={kaduses[1]} left={370} top={570} />
                <AbsoluteCard data={kaduses[2]} left={570} top={570} />
                <AbsoluteCard data={kaduses[3]} left={770} top={570} />
             </div>
          </div>
        )}

        {/* =========== TAMPILAN LEMBAGA LAINNYA (TABEL) =========== */}
        {!isPerangkat && (
          <div className="animate-in slide-in-from-bottom-4 max-w-6xl mx-auto">
            {isAdmin && (
              <div className="mb-6 flex justify-end">
                <button onClick={() => openEditorLembaga()} className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 px-6 rounded-xl shadow-lg flex items-center transition-all"><Plus className="w-5 h-5 mr-2" /> Tambah Data</button>
              </div>
            )}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
              {filteredLembaga.length === 0 ? (
                <div className="text-center text-gray-500 py-16 font-medium text-lg">Belum ada data tersedia.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left whitespace-nowrap">
                    <thead>
                      <tr className="bg-emerald-50 text-emerald-800 text-sm tracking-wide uppercase border-b-2 border-emerald-100">
                        <th className="px-6 py-5 font-bold">No</th><th className="px-6 py-5 font-bold">Foto</th><th className="px-6 py-5 font-bold">Nama Lengkap</th><th className="px-6 py-5 font-bold">Jabatan</th><th className="px-6 py-5 font-bold">L/P</th><th className="px-6 py-5 font-bold">Umur</th>{isAdmin && <th className="px-6 py-5 font-bold text-center">Aksi</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredLembaga.map((item: any, index: number) => (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-bold text-gray-500">{index + 1}</td>
                          <td className="px-6 py-4"><img src={item.foto || 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=150&q=80'} className="w-14 h-14 rounded-xl object-cover shadow-sm border border-gray-200 bg-white"/></td>
                          <td className="px-6 py-4 font-extrabold text-gray-900 text-base">{item.nama}</td>
                          <td className="px-6 py-4 text-emerald-700 font-bold bg-emerald-50/50 rounded-lg inline-block mt-3.5 mb-1.5 ml-4 px-3 py-1 border border-emerald-100/50">{item.jabatan}</td>
                          <td className="px-6 py-4 font-medium text-gray-700">{item.jenisKelamin}</td>
                          <td className="px-6 py-4 font-medium text-gray-700">{item.umur} Thn</td>
                          {isAdmin && (
                            <td className="px-6 py-4">
                              <div className="flex justify-center gap-2">
                                <button onClick={() => openEditorLembaga(item)} className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition"><Edit className="w-5 h-5" /></button>
                                <button onClick={() => showConfirm('Hapus data?', ()=>setDaftarLembaga(daftarLembaga.filter((l:any)=>l.id!==item.id)))} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition"><Trash2 className="w-5 h-5" /></button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal Admin Perangkat (SOTK) */}
      {showEditorPerangkat && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95">
            <h3 className="font-bold text-2xl mb-6 text-gray-900">Data Perangkat</h3>
            <form onSubmit={handleSavePerangkat} className="space-y-5">
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-2">Posisi Jabatan (Sesuai Diagram)</label>
                <select required value={editDataPerangkat.kategori_jabatan} onChange={e => setEditDataPerangkat({...editDataPerangkat, kategori_jabatan: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-4 focus:ring-emerald-500/20 outline-none">
                  <option value="KADES">Kepala Desa (Tengah Atas)</option>
                  <option value="SEKDES">Sekretaris Desa (Kanan Atas)</option>
                  <option value="KASI">Kepala Seksi (Kiri Tengah)</option>
                  <option value="KAUR">Kepala Urusan (Kanan Tengah)</option>
                  <option value="KADUS">Kepala Dusun (Bawah)</option>
                </select>
              </div>
              <div><label className="text-sm font-bold text-gray-700 block mb-2">Nama Lengkap</label><input type="text" required value={editDataPerangkat.nama} onChange={e=>setEditDataPerangkat({...editDataPerangkat, nama: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-4 focus:ring-emerald-500/20 outline-none" /></div>
              <div><label className="text-sm font-bold text-gray-700 block mb-2">Jabatan Ditampilkan</label><input type="text" required value={editDataPerangkat.jabatan} onChange={e=>setEditDataPerangkat({...editDataPerangkat, jabatan: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-4 focus:ring-emerald-500/20 outline-none" /></div>
              <div>
                 <label className="text-sm font-bold text-gray-700 block mb-2">Foto Profil</label>
                 <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-200">
                   {editDataPerangkat.foto && <img src={editDataPerangkat.foto} className="w-12 h-12 rounded object-cover shadow" />}
                   <input type="file" accept="image/*" onChange={handleImageUploadPerangkat} className="w-full text-sm font-medium text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer" />
                 </div>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => setShowEditorPerangkat(false)} className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold">Batal</button>
                <button type="submit" className="px-5 py-2.5 bg-[#0284c7] text-white rounded-xl font-bold shadow-lg">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Admin Lembaga Lainnya */}
      {showEditorLembaga && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl animate-in zoom-in-95">
            <h3 className="font-bold text-2xl mb-6 text-gray-900">Edit Data Tabel</h3>
            <form onSubmit={handleSaveLembaga} className="space-y-5">
              <div><label className="text-sm font-bold text-gray-700 block mb-2">Nama Lengkap</label><input type="text" required value={editDataLembaga.nama} onChange={e=>setEditDataLembaga({...editDataLembaga, nama: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 outline-none" /></div>
              <div><label className="text-sm font-bold text-gray-700 block mb-2">Jabatan</label><input type="text" required value={editDataLembaga.jabatan} onChange={e=>setEditDataLembaga({...editDataLembaga, jabatan: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 outline-none" /></div>
              <div className="grid grid-cols-2 gap-5">
                 <div>
                   <label className="text-sm font-bold text-gray-700 block mb-2">Jenis Kelamin</label>
                   <select value={editDataLembaga.jenisKelamin} onChange={e=>setEditDataLembaga({...editDataLembaga, jenisKelamin: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 outline-none"><option value="Laki-laki">Laki-laki</option><option value="Perempuan">Perempuan</option></select>
                 </div>
                 <div><label className="text-sm font-bold text-gray-700 block mb-2">Umur</label><input type="number" required value={editDataLembaga.umur} onChange={e=>setEditDataLembaga({...editDataLembaga, umur: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 outline-none" /></div>
              </div>
              <div>
                 <label className="text-sm font-bold text-gray-700 block mb-2">Foto</label>
                 <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-200">
                   {editDataLembaga.foto && <img src={editDataLembaga.foto} className="w-12 h-12 rounded object-cover shadow" />}
                   <input type="file" accept="image/*" onChange={handleImageUploadLembaga} className="w-full text-sm font-medium text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer" />
                 </div>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => setShowEditorLembaga(false)} className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold">Batal</button>
                <button type="submit" className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold shadow-lg">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


/* ================= KOMPONEN GRAFIK (DENGAN FUNGSI ADMIN) ================= */

function HalamanGrafikKeuangan({ isAdmin, dataKeuangan, setDataKeuangan }: any) {
  const [showEditor, setShowEditor] = useState(false);
  const [editForm, setEditForm] = useState<any[]>([]);

  // Pastikan ada data minimal agar grafik tidak error
  const displayData = dataKeuangan && dataKeuangan.length > 0 ? dataKeuangan : [{ id: 1, tahun: '2024', pendapatan: 0, pengeluaran: 0 }];
  const maxValue = Math.max(...displayData.map((d: any) => Math.max(d.pendapatan, d.pengeluaran))) || 1;
  
  const openEditor = () => {
    setEditForm([...displayData]);
    setShowEditor(true);
  };

  const handleRowChange = (index: number, field: string, value: string) => {
    const updated = [...editForm];
    updated[index][field] = field === 'tahun' ? value : Number(value);
    setEditForm(updated);
  };

  const addRow = () => {
    setEditForm([...editForm, { id: Date.now(), tahun: '', pendapatan: 0, pengeluaran: 0 }]);
  };

  const removeRow = (index: number) => {
    const updated = editForm.filter((_, i) => i !== index);
    setEditForm(updated);
  };

  const handleSave = (e: any) => {
    e.preventDefault();
    setDataKeuangan(editForm);
    setShowEditor(false);
  };

  return (
    <div className="animate-in fade-in py-16 bg-gray-50 min-h-[70vh]">
      <div className="container mx-auto px-4 max-w-4xl">
         <div className="text-center mb-12">
            <span className="text-emerald-600 font-bold tracking-widest uppercase text-sm mb-2 block">Transparansi Dana</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">Grafik Pendapatan & Pengeluaran</h2>
            <div className="w-24 h-1.5 bg-emerald-500 mx-auto rounded-full mt-4"></div>
         </div>

         {isAdmin && (
            <div className="mb-6 flex justify-end">
              <button onClick={openEditor} className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 px-6 rounded-xl shadow-lg flex items-center transition-all">
                <Edit className="w-5 h-5 mr-2" /> Edit Data Grafik
              </button>
            </div>
         )}

         <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
           <div className="flex justify-between items-center mb-10">
              <div className="flex gap-4 sm:gap-6 flex-wrap">
                 <div className="flex items-center gap-2"><div className="w-4 h-4 bg-emerald-500 rounded-sm"></div><span className="font-bold text-gray-600 text-sm">Pendapatan (Juta Rp)</span></div>
                 <div className="flex items-center gap-2"><div className="w-4 h-4 bg-rose-500 rounded-sm"></div><span className="font-bold text-gray-600 text-sm">Pengeluaran (Juta Rp)</span></div>
              </div>
           </div>

           <div className="h-80 flex items-end justify-between gap-2 sm:gap-6 border-b-2 border-gray-200 pb-2 relative">
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10">
                 <div className="w-full h-px bg-gray-900"></div><div className="w-full h-px bg-gray-900"></div><div className="w-full h-px bg-gray-900"></div><div className="w-full h-px bg-gray-900"></div>
              </div>

              {displayData.map((data: any, index: number) => {
                 const percentIn = (data.pendapatan / maxValue) * 100;
                 const percentOut = (data.pengeluaran / maxValue) * 100;
                 return (
                   <div key={index} className="flex flex-col items-center flex-1 z-10 group">
                      <div className="flex items-end justify-center w-full gap-1 sm:gap-2 h-full">
                         <div className="w-full max-w-[40px] bg-emerald-500 rounded-t-md relative transition-all duration-500 hover:opacity-80" style={{ height: `${percentIn}%` }}>
                            <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] sm:text-xs font-bold text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity bg-white px-2 py-1 shadow rounded z-20">{data.pendapatan}</div>
                         </div>
                         <div className="w-full max-w-[40px] bg-rose-500 rounded-t-md relative transition-all duration-500 hover:opacity-80" style={{ height: `${percentOut}%` }}>
                            <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] sm:text-xs font-bold text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity bg-white px-2 py-1 shadow rounded z-20">{data.pengeluaran}</div>
                         </div>
                      </div>
                      <span className="mt-4 font-bold text-gray-600 text-xs sm:text-sm">{data.tahun}</span>
                   </div>
                 )
              })}
           </div>
         </div>
      </div>

      {/* Modal Admin Edit Keuangan */}
      {showEditor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            <h3 className="font-bold text-2xl mb-6 text-gray-900 flex items-center">
               <div className="bg-emerald-100 p-2 rounded-xl mr-3"><BarChart3 className="w-6 h-6 text-emerald-600" /></div> Edit Grafik Keuangan
            </h3>
            
            <div className="overflow-y-auto flex-grow pr-2 space-y-4 mb-6">
               {editForm.map((row, index) => (
                 <div key={row.id || index} className="grid grid-cols-12 gap-3 items-end bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div className="col-span-3">
                      <label className="block text-xs font-bold text-gray-500 mb-1">Tahun</label>
                      <input type="text" value={row.tahun} onChange={e=>handleRowChange(index, 'tahun', e.target.value)} className="w-full p-2 border rounded-lg" required/>
                    </div>
                    <div className="col-span-4">
                      <label className="block text-xs font-bold text-emerald-600 mb-1">Pendapatan (Juta)</label>
                      <input type="number" value={row.pendapatan} onChange={e=>handleRowChange(index, 'pendapatan', e.target.value)} className="w-full p-2 border rounded-lg" required/>
                    </div>
                    <div className="col-span-4">
                      <label className="block text-xs font-bold text-rose-600 mb-1">Pengeluaran (Juta)</label>
                      <input type="number" value={row.pengeluaran} onChange={e=>handleRowChange(index, 'pengeluaran', e.target.value)} className="w-full p-2 border rounded-lg" required/>
                    </div>
                    <div className="col-span-1 pb-1">
                      <button type="button" onClick={() => removeRow(index)} className="p-2 text-rose-500 hover:bg-rose-100 rounded-lg"><Trash2 className="w-5 h-5"/></button>
                    </div>
                 </div>
               ))}
               
               <button type="button" onClick={addRow} className="w-full py-3 border-2 border-dashed border-emerald-300 text-emerald-600 font-bold rounded-xl flex items-center justify-center hover:bg-emerald-50">
                  <Plus className="w-5 h-5 mr-2" /> Tambah Tahun Baru
               </button>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button type="button" onClick={() => setShowEditor(false)} className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold">Batal</button>
              <button onClick={handleSave} className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold shadow-lg">Simpan Perubahan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HalamanGrafikPenduduk({ isAdmin, dataBeranda, setDataBeranda }: any) {
  const [showEditor, setShowEditor] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);

  const statUtama = dataBeranda.stats[0] || { num: '0', subLaki: '0', subPerempuan: '0' }; 
  const total = parseInt((statUtama.num || '0').replace(/\./g,'')) || 1;
  const laki = parseInt((statUtama.subLaki || '0').replace(/\./g,'')) || 0;
  const perempuan = parseInt((statUtama.subPerempuan || '0').replace(/\./g,'')) || 0;
  
  const pctLaki = ((laki / total) * 100).toFixed(1);
  const pctPr = ((perempuan / total) * 100).toFixed(1);

  const openEditor = () => {
    setEditForm({ ...statUtama });
    setShowEditor(true);
  };

  const handleSave = (e: any) => {
    e.preventDefault();
    const newStats = dataBeranda.stats.map((s: any) => s.id === 1 ? editForm : s);
    setDataBeranda({ ...dataBeranda, stats: newStats });
    setShowEditor(false);
  };

  return (
    <div className="animate-in fade-in py-16 bg-gray-50 min-h-[70vh]">
      <div className="container mx-auto px-4 max-w-4xl">
         <div className="text-center mb-12">
            <span className="text-emerald-600 font-bold tracking-widest uppercase text-sm mb-2 block">Statistik Demografi</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">Grafik Jumlah Penduduk</h2>
            <div className="w-24 h-1.5 bg-emerald-500 mx-auto rounded-full mt-4"></div>
         </div>

         {isAdmin && (
            <div className="mb-6 flex justify-end">
              <button onClick={openEditor} className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 px-6 rounded-xl shadow-lg flex items-center transition-all">
                <Edit className="w-5 h-5 mr-2" /> Edit Data Penduduk
              </button>
            </div>
         )}

         <div className="bg-white p-8 md:p-16 rounded-3xl shadow-xl border border-gray-100 flex flex-col md:flex-row items-center justify-center gap-16">
            <div className="relative w-64 h-64 rounded-full shadow-inner flex items-center justify-center" style={{ background: `conic-gradient(#3b82f6 0% ${pctLaki}%, #ec4899 ${pctLaki}% 100%)` }}>
               <div className="w-48 h-48 bg-white rounded-full flex flex-col items-center justify-center shadow-lg border border-gray-50 z-10">
                 <span className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-1">Total</span>
                 <span className="text-4xl font-black text-gray-800">{statUtama.num}</span>
               </div>
            </div>

            <div className="flex flex-col gap-6 w-full md:w-auto">
               <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl flex items-center gap-6">
                 <div className="bg-blue-500 text-white p-4 rounded-xl shadow-lg"><Users className="w-8 h-8"/></div>
                 <div>
                   <div className="text-blue-900 font-extrabold text-2xl">{statUtama.subLaki} Jiwa</div>
                   <div className="text-blue-700 font-bold text-sm">Laki-laki ({pctLaki}%)</div>
                 </div>
               </div>
               <div className="bg-pink-50 border border-pink-100 p-6 rounded-2xl flex items-center gap-6">
                 <div className="bg-pink-500 text-white p-4 rounded-xl shadow-lg"><Users className="w-8 h-8"/></div>
                 <div>
                   <div className="text-pink-900 font-extrabold text-2xl">{statUtama.subPerempuan} Jiwa</div>
                   <div className="text-pink-700 font-bold text-sm">Perempuan ({pctPr}%)</div>
                 </div>
               </div>
            </div>
         </div>
      </div>

      {/* Modal Admin Edit Penduduk */}
      {showEditor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95">
            <h3 className="font-bold text-2xl mb-6 text-gray-900 flex items-center">
               <div className="bg-emerald-100 p-2 rounded-xl mr-3"><PieChart className="w-6 h-6 text-emerald-600" /></div> Edit Penduduk
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
               <div>
                  <label className="text-sm font-bold text-gray-700 block mb-1">Total Penduduk (Gunakan Titik)</label>
                  <input type="text" required value={editForm.num} onChange={e=>setEditForm({...editForm, num: e.target.value})} className="w-full p-3 border rounded-xl bg-gray-50" />
               </div>
               <div>
                  <label className="text-sm font-bold text-blue-700 block mb-1">Jumlah Laki-laki</label>
                  <input type="text" required value={editForm.subLaki} onChange={e=>setEditForm({...editForm, subLaki: e.target.value})} className="w-full p-3 border rounded-xl bg-blue-50" />
               </div>
               <div>
                  <label className="text-sm font-bold text-pink-700 block mb-1">Jumlah Perempuan</label>
                  <input type="text" required value={editForm.subPerempuan} onChange={e=>setEditForm({...editForm, subPerempuan: e.target.value})} className="w-full p-3 border rounded-xl bg-pink-50" />
               </div>
               <div className="flex justify-end gap-3 mt-8">
                 <button type="button" onClick={() => setShowEditor(false)} className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold">Batal</button>
                 <button type="submit" className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold shadow-lg">Simpan</button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


/* ================= KOMPONEN BERITA (DIPULIHKAN PENUH) ================= */

function HalamanBerita({ isAdmin, daftarBerita, setDaftarBerita, showConfirm }: any) {
  const [showEditor, setShowEditor] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [selectedBerita, setSelectedBerita] = useState<any>(null);

  const handleDelete = (id: any) => {
    showConfirm('Yakin ingin menghapus berita ini?', () => {
      setDaftarBerita(daftarBerita.filter((b: any) => b.id !== id));
    });
  };

  const openEditor = (berita: any = null) => {
    if (berita) {
      setEditData(berita);
    } else {
      setEditData({ id: null, judul: '', tanggal: '', kategori: '', excerpt: '', gambar: '' });
    }
    setShowEditor(true);
  };

  const handleSave = (e: any) => {
    e.preventDefault();
    if (editData.id) {
      setDaftarBerita(daftarBerita.map((b: any) => b.id === editData.id ? editData : b));
      if (selectedBerita && selectedBerita.id === editData.id) {
        setSelectedBerita(editData);
      }
    } else {
      const newBerita = { ...editData, id: Date.now() };
      setDaftarBerita([newBerita, ...daftarBerita]);
    }
    setShowEditor(false);
  };

  const handleImageUpload = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      compressImage(file, 500, false, (base64: any) => {
        setEditData({ ...editData, gambar: base64 });
      });
      e.target.value = '';
    }
  };

  return (
    <div className="animate-in fade-in zoom-in-95 duration-500 py-16 bg-gray-50 min-h-[70vh]">
      <div className="container mx-auto px-4 lg:px-8 relative">
        
        {selectedBerita ? (
          <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 animate-in slide-in-from-bottom-8 duration-500">
            <div className="p-4 md:p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
               <button 
                 onClick={() => setSelectedBerita(null)} 
                 className="flex items-center text-emerald-600 hover:text-emerald-800 font-bold transition px-4 py-2 hover:bg-emerald-50 rounded-xl"
               >
                  <ArrowRight className="w-5 h-5 mr-2 rotate-180" /> Kembali ke Daftar Berita
               </button>
            </div>
            
            <div className="w-full h-64 md:h-[450px] overflow-hidden bg-gray-200">
               <img 
                 src={selectedBerita.gambar} 
                 alt={selectedBerita.judul} 
                 className="w-full h-full object-cover"
                 onError={(e: any) => { 
                   if (e.target.src !== 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200&q=80') {
                     e.target.src = 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200&q=80';
                   }
                 }}
               />
            </div>
            
            <div className="p-8 md:p-14">
               <div className="flex items-center gap-4 mb-6">
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-extrabold px-4 py-1.5 rounded-full uppercase tracking-wider">
                    {selectedBerita.kategori}
                  </span>
                  <span className="text-sm font-bold text-gray-500">{selectedBerita.tanggal}</span>
               </div>
               <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-8 leading-tight tracking-tight">
                 {selectedBerita.judul}
               </h2>
               <div className="w-20 h-1.5 bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-full mb-10"></div>
               
               <div className="text-gray-700 text-lg md:text-xl leading-relaxed whitespace-pre-wrap font-medium">
                  {selectedBerita.excerpt}
               </div>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center mb-16">
              <span className="text-emerald-600 font-bold tracking-widest uppercase text-sm mb-2 block">Pusat Informasi</span>
              <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">Berita & Informasi</h2>
              <div className="w-24 h-1.5 bg-gradient-to-r from-emerald-600 to-emerald-400 mx-auto rounded-full"></div>
              <p className="mt-6 text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed">
                Kabar terbaru seputar kegiatan, pengumuman, dan pembangunan di Desa Upang Mulya.
              </p>
            </div>

            {isAdmin && (
              <div className="mb-10 flex justify-end bg-emerald-50 p-4 rounded-2xl border border-emerald-100 shadow-sm">
                <button 
                  onClick={() => openEditor()} 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 px-8 rounded-xl shadow-[0_8px_20px_rgba(5,150,105,0.3)] hover:shadow-[0_10px_25px_rgba(5,150,105,0.4)] hover:-translate-y-0.5 flex items-center transition-all"
                >
                  <Plus className="w-5 h-5 mr-2" /> Tulis Berita Baru
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {daftarBerita.length === 0 && (
                 <div className="col-span-full text-center text-gray-500 py-20 bg-white rounded-3xl border border-dashed border-gray-300 font-medium text-lg">Belum ada berita yang diterbitkan.</div>
              )}

              {daftarBerita.map((berita: any) => (
                <div key={berita.id} className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col relative border border-gray-100 group overflow-hidden">
                  {isAdmin && (
                    <div className="absolute top-4 right-4 z-20 flex gap-2">
                      <button onClick={() => openEditor(berita)} className="bg-amber-500 hover:bg-amber-600 text-white p-2.5 rounded-xl shadow-lg transition">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(berita.id)} className="bg-rose-500 hover:bg-rose-600 text-white p-2.5 rounded-xl shadow-lg transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <div className="relative h-60 overflow-hidden bg-gray-200">
                    <img 
                      src={berita.gambar} 
                      alt={berita.judul} 
                      className="w-full h-full object-cover transition duration-700 group-hover:scale-110"
                      onError={(e: any) => { 
                        if (e.target.src !== 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=600&q=80') {
                          e.target.src = 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=600&q=80';
                        }
                      }}
                    />
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur text-emerald-800 text-xs font-extrabold px-4 py-1.5 rounded-full shadow-sm border border-emerald-100">
                      {berita.kategori}
                    </div>
                  </div>
                  <div className="p-8 flex-grow flex flex-col">
                    <div className="text-sm font-bold text-gray-400 mb-3 flex items-center">
                      <span>{berita.tanggal}</span>
                    </div>
                    <h3 className="text-2xl font-extrabold text-gray-900 mb-4 leading-tight line-clamp-2 group-hover:text-emerald-700 transition-colors">
                      {berita.judul}
                    </h3>
                    <p className="text-gray-600 mb-6 flex-grow line-clamp-3 text-lg leading-relaxed">
                      {berita.excerpt}
                    </p>
                    
                    <button 
                      onClick={() => setSelectedBerita(berita)}
                      className="mt-auto text-emerald-600 font-extrabold hover:text-emerald-800 flex items-center transition group-hover:underline decoration-2 underline-offset-4"
                    >
                      Baca Selengkapnya <ArrowRight className="w-5 h-5 ml-1.5 transform group-hover:translate-x-1 transition" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {showEditor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto border border-emerald-100 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100">
              <h3 className="text-2xl font-extrabold text-gray-900 flex items-center">
                <div className="bg-emerald-100 p-2 rounded-xl mr-3">
                   <Newspaper className="w-6 h-6 text-emerald-600" />
                </div>
                {editData.id ? 'Edit Berita' : 'Tambah Berita Baru'}
              </h3>
              <button type="button" onClick={() => setShowEditor(false)} className="text-gray-400 hover:text-gray-600 bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-full">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Judul Berita</label>
                  <input 
                    type="text" required
                    value={editData.judul}
                    onChange={(e) => setEditData({...editData, judul: e.target.value})}
                    className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Kategori</label>
                  <select 
                    required
                    value={editData.kategori}
                    onChange={(e) => setEditData({...editData, kategori: e.target.value})}
                    className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                  >
                    <option value="">Pilih Kategori</option>
                    <option value="Sosial">Sosial</option>
                    <option value="Kegiatan">Kegiatan</option>
                    <option value="Pemberdayaan">Pemberdayaan</option>
                    <option value="Pemerintahan">Pemerintahan</option>
                    <option value="Pengumuman">Pengumuman</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Tanggal Publikasi</label>
                  <input 
                    type="text" required placeholder="Contoh: 15 Okt 2024"
                    value={editData.tanggal}
                    onChange={(e) => setEditData({...editData, tanggal: e.target.value})}
                    className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium" 
                  />
                </div>

                <div className="col-span-full">
                  <label className="block text-sm font-bold text-gray-700 mb-3">Gambar / Foto Berita</label>
                  <div className="flex items-center gap-5 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                    {editData.gambar ? (
                      <img src={editData.gambar} alt="Preview" className="w-32 h-32 object-cover rounded-xl shadow-sm border border-gray-200" />
                    ) : (
                      <div className="w-32 h-32 bg-gray-200 rounded-xl flex items-center justify-center border border-gray-300 border-dashed">
                        <ImageIcon className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <label className="cursor-pointer bg-white text-emerald-700 border-2 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 px-5 py-3 rounded-xl font-bold flex items-center justify-center transition-all shadow-sm">
                        <Upload className="w-5 h-5 mr-2" /> Upload Foto Baru
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      </label>
                      <p className="text-sm text-gray-500 mt-3 font-medium">Otomatis di-compress agar memori tidak penuh.</p>
                    </div>
                  </div>
                </div>

                <div className="col-span-full">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Ringkasan / Isi Berita</label>
                  <textarea 
                    required rows={5}
                    value={editData.excerpt}
                    onChange={(e) => setEditData({...editData, excerpt: e.target.value})}
                    className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium leading-relaxed" 
                  ></textarea>
                </div>
              </div>
              
              <div className="flex justify-end gap-4 pt-6 sticky bottom-0 bg-white p-4 -mx-8 -mb-8 rounded-b-3xl">
                <button type="button" onClick={() => setShowEditor(false)} className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold transition-colors">
                  Batal
                </button>
                <button type="submit" className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center transition-all shadow-[0_8px_20px_rgba(5,150,105,0.3)] hover:shadow-[0_10px_25px_rgba(5,150,105,0.4)] hover:-translate-y-0.5">
                  <Save className="w-5 h-5 mr-2" /> Simpan Berita
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function HalamanKontak() {
  return (
    <div className="animate-in fade-in zoom-in-95 duration-500 py-16 bg-gray-50 min-h-[70vh]">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-emerald-600 font-bold tracking-widest uppercase text-sm mb-2 block">Layanan Pengaduan</span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">Hubungi Kami</h2>
          <div className="w-24 h-1.5 bg-gradient-to-r from-emerald-600 to-emerald-400 mx-auto rounded-full"></div>
          <p className="mt-6 text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed">
            Punya pertanyaan, masukan, atau perlu layanan dari Pemerintah Desa? Silakan kunjungi atau hubungi kami.
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">
          <div className="bg-white p-10 md:p-12 rounded-3xl shadow-xl border border-gray-100 h-full flex flex-col justify-between relative overflow-hidden">
             <div className="absolute bottom-0 right-0 w-40 h-40 bg-emerald-50 rounded-tl-full -z-10"></div>

            <div>
              <h3 className="text-3xl font-extrabold text-gray-900 mb-8 tracking-tight">Informasi Kontak</h3>
              <div className="space-y-8">
                <div className="flex items-start group">
                  <div className="bg-emerald-50 p-4 rounded-2xl text-emerald-600 mr-5 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300 shadow-sm border border-emerald-100 group-hover:border-emerald-600">
                    <MapPin className="w-7 h-7" />
                  </div>
                  <div className="pt-1">
                    <h4 className="font-extrabold text-gray-900 text-xl">Alamat Kantor Desa</h4>
                    <p className="text-gray-600 leading-relaxed mt-2 text-lg">
                      Jl. Sunan Kalijaga Dusun II, Rt. 01 Rw. 01<br/>
                      Kecamatan Makarti Jaya, Kabupaten Banyuasin<br/>
                      Provinsi Sumatera Selatan, 30972
                    </p>
                  </div>
                </div>
                <div className="flex items-start group">
                  <div className="bg-emerald-50 p-4 rounded-2xl text-emerald-600 mr-5 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300 shadow-sm border border-emerald-100 group-hover:border-emerald-600">
                    <Phone className="w-7 h-7" />
                  </div>
                  <div className="pt-1">
                    <h4 className="font-extrabold text-gray-900 text-xl">Telepon / WhatsApp</h4>
                    <p className="text-gray-600 mt-2 text-lg font-medium">+62 822-6876-4585</p>
                  </div>
                </div>
                <div className="flex items-start group">
                  <div className="bg-emerald-50 p-4 rounded-2xl text-emerald-600 mr-5 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300 shadow-sm border border-emerald-100 group-hover:border-emerald-600">
                    <Mail className="w-7 h-7" />
                  </div>
                  <div className="pt-1">
                    <h4 className="font-extrabold text-gray-900 text-xl">Email</h4>
                    <p className="text-gray-600 mt-2 text-lg font-medium">upangmulya@gmail.com</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-12 pt-8 border-t border-gray-100 bg-gray-50 -mx-10 -mb-10 p-10 md:p-12 rounded-b-3xl">
              <h4 className="font-extrabold text-gray-900 mb-5 text-xl">Jam Pelayanan Masyarakat:</h4>
              <ul className="text-gray-700 space-y-3 text-lg">
                <li className="flex justify-between items-center bg-white p-3 px-4 rounded-xl shadow-sm border border-gray-100"><span className="font-bold">Senin - Kamis</span> <span className="text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded-lg">08.00 - 15.00 WIB</span></li>
                <li className="flex justify-between items-center bg-white p-3 px-4 rounded-xl shadow-sm border border-gray-100"><span className="font-bold">Jumat</span> <span className="text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded-lg">08.00 - 11.30 WIB</span></li>
                <li className="flex justify-between items-center bg-rose-50 p-3 px-4 rounded-xl shadow-sm border border-rose-100"><span className="font-bold text-rose-800">Sabtu - Minggu</span> <span className="text-rose-700 font-bold">Tutup</span></li>
              </ul>
            </div>
          </div>

          <div className="bg-white p-3 rounded-3xl shadow-xl h-full min-h-[500px] border border-gray-100">
            <div className="w-full h-full bg-gray-100 rounded-2xl flex flex-col items-center justify-center text-gray-500 overflow-hidden relative group cursor-pointer">
              <img 
                src="https://images.unsplash.com/photo-1524661135-423995f22d0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                alt="Peta" 
                className="w-full h-full object-cover opacity-60 group-hover:scale-105 group-hover:opacity-80 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent"></div>
              <div className="absolute inset-0 flex flex-col items-center justify-center transition-transform duration-300 group-hover:-translate-y-2">
                 <div className="bg-white p-4 rounded-full shadow-2xl mb-4 group-hover:shadow-[0_0_30px_rgba(5,150,105,0.6)] transition-all">
                   <MapPin className="w-10 h-10 text-emerald-600" />
                 </div>
                 <span className="font-extrabold text-2xl text-white drop-shadow-lg text-center px-4">Lokasi Kantor <br/> Desa Upang Mulya</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= Helper Components ================= */

function NavButton({ children, active, onClick, icon }: any) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2.5 rounded-xl font-bold flex items-center transition-all duration-300 text-sm tracking-wide ${
        active 
          ? 'bg-white text-emerald-900 shadow-md' 
          : 'text-white hover:bg-white/10 hover:text-white'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function MobileNavButton({ children, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`block w-full text-left px-5 py-4 rounded-xl text-lg font-bold transition-all ${
        active 
          ? 'bg-emerald-800 text-white border-l-4 border-emerald-400 shadow-inner' 
          : 'text-emerald-100 hover:bg-emerald-800/80 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}
