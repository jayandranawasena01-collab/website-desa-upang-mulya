import React, { useState, useEffect } from 'react';
import { 
  Menu, X, Home, Info, Users, Newspaper, Phone, 
  MapPin, Mail, ChevronRight, Landmark, ArrowRight,
  LogIn, LogOut, Edit, Trash2, Plus, Image as ImageIcon, Save, Upload, CheckCircle2,
  BookOpen, Target, Map, Building2, ChevronDown, CalendarDays, PieChart, TrendingUp, Activity
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
    
    // Prioritaskan config dari environment (Canvas) jika ada, jika tidak gunakan config manual
    const firebaseConfig = (typeof __firebase_config !== 'undefined' && __firebase_config) 
      ? JSON.parse(__firebase_config) 
      : firebaseConfigManual;
    
    if (firebaseConfig && firebaseConfig.apiKey) {
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
    judul: "Penyaluran Bantuan Langsung Tunai (BLT) Dana Desa Upang Mulya Tahap III",
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
    excerpt: "Mengantisipasi datangnya musim penghujan, warga Desa Upang Mulya bergotong royong membersihkan saluran air dan fasilitas umum guna mencegah banjir...\n\n(Teks selengkapnya) Kegiatan ini diikuti oleh seluruh elemen masyarakat. Selain membersihkan selokan, warga juga melakukan pemangkasan dahan pohon yang rawan tumbang serta membersihkan area pekarangan fasilitas umum."
  },
  {
    id: 3,
    judul: "Pelatihan Pembuatan Pupuk Kompos untuk Kelompok Tani",
    tanggal: "28 Sep 2024",
    kategori: "Pemberdayaan",
    gambar: "https://images.unsplash.com/photo-1592982537447-6f2a6a0a091c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    excerpt: "BUMDes bekerja sama dengan penyuluh pertanian kecamatan mengadakan pelatihan pembuatan pupuk kompos organik yang diikuti oleh petani lokal Upang Mulya...\n\n(Teks selengkapnya) Pelatihan ini bertujuan untuk meningkatkan kemandirian petani dalam penyediaan pupuk, menekan biaya produksi pertanian, sekaligus mengedukasi warga tentang pengelolaan limbah organik."
  }
];

const initialGrafik = {
  lakiLaki: 1874,
  perempuan: 1815,
  tahun: 2024,
  updateTerakhir: "Desember 2024"
};

const thn = new Date().getFullYear();
const bln = String(new Date().getMonth() + 1).padStart(2, '0');
const initialAgenda = [
  { id: 1, judul: "Kerja Bakti Bersih Desa", lokasi: "Seluruh Area Dusun", tanggal: `${thn}-${bln}-05` },
  { id: 2, judul: "Penyaluran BLT Tahap Lanjutan", lokasi: "Balai Desa Upang Mulya", tanggal: `${thn}-${bln}-12` },
  { id: 3, judul: "Musyawarah Perencanaan Pembangunan", lokasi: "Balai Desa Upang Mulya", tanggal: `${thn}-${bln}-28` }
];

const initialPerangkat = [
  { id: 1, nama: "SUBERO", jabatan: "KEPALA DESA", foto: "https://images.unsplash.com/photo-1552058544-f2b08422138a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" },
  { id: 2, nama: "SUPENO", jabatan: "SEKRETARIS DESA", foto: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" },
  { id: 3, nama: "SUYANTO", jabatan: "KASI KESRA", foto: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" },
  { id: 4, nama: "SOLEKAN", jabatan: "KASI PEMERINTAHAN", foto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" },
  { id: 5, nama: "OCTARIO SAKTI SUSILO", jabatan: "KASI PELAYANAN", foto: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" },
  { id: 6, nama: "KHOIRUL ANAM", jabatan: "KAUR TATA USAHA DAN UMUM", foto: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" },
  { id: 7, nama: "AHMAD FARIS SEPTIAN N", jabatan: "KAUR KEUANGAN", foto: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" },
  { id: 8, nama: "MARKUWAT", jabatan: "KAUR PERENCANAAN", foto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" },
  { id: 9, nama: "HERU EKO W", jabatan: "KASUN I", foto: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" },
  { id: 10, nama: "CAHYO DIMAS", jabatan: "KASUN II", foto: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" },
  { id: 11, nama: "WAHYU SETYO B", jabatan: "KASUN III", foto: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" }
];

const initialLembaga = [
  { id: 1, kategori: 'bpd', nama: 'Suryadi, S.H.', jabatan: 'Ketua BPD', jenisKelamin: 'Laki-laki', umur: 45, foto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80' },
  { id: 2, kategori: 'pkk', nama: 'Ibu Ratna', jabatan: 'Ketua Tim Penggerak PKK', jenisKelamin: 'Perempuan', umur: 42, foto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80' },
  { id: 3, kategori: 'kadus', nama: 'Bambang Irawan', jabatan: 'Kepala Dusun I', jenisKelamin: 'Laki-laki', umur: 50, foto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80' },
  { id: 4, kategori: 'rt', nama: 'Suharto', jabatan: 'Ketua RT 01', jenisKelamin: 'Laki-laki', umur: 48, foto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80' }
];

const initialProfil = [
  {
    id: 1,
    iconName: "BookOpen",
    judul: "Sejarah",
    gambar: "https://images.unsplash.com/photo-1572005996025-06900f6b6474?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
    konten: "Desa Upang Mulya memiliki sejarah panjang yang mengakar pada nilai-nilai perjuangan dan semangat gotong royong masyarakat. Sejak awal berdirinya, desa ini terus berkembang menjadi pusat harmoni sosial tempat bertemunya keberagaman budaya yang menyatu dalam kehangatan.\n\nPerjalanan panjang desa ini tidak lepas dari peran serta tetua adat dan tokoh masyarakat yang bahu-membahu membangun peradaban dari tanah yang dulunya terpencil menjadi kawasan yang kian maju dan terbuka terhadap inovasi."
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
    judul: "Kondisi Geografis",
    gambar: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
    konten: "Terletak di bentang alam yang subur dan dialiri oleh perairan sungai yang strategis, Desa Upang Mulya menyimpan potensi agraris dan perikanan yang sangat melimpah.\n\nKondisi topografi dataran rendah dengan curah hujan yang seimbang menjadikan tanah di desa kami sangat cocok untuk pengembangan sektor pertanian unggulan. Suasana pedesaan yang asri, udara yang segar, serta hamparan alam yang masih terjaga menjadikan Upang Mulya tidak hanya makmur secara ekonomi namun juga nyaman untuk ditinggali."
  },
  {
    id: 4,
    iconName: "Building2",
    judul: "Struktur Organisasi",
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
  namaKades: "Hasanuddin, S.IP",
  jabatanKades: "Kepala Desa Upang Mulya",
  sambutanKades: "Assalamu'alaikum Warahmatullahi Wabarakatuh. Puji syukur kita panjatkan ke hadirat Allah SWT. Selamat datang di website resmi Desa Upang Mulya. Melalui media ini, kami berupaya mewujudkan transparansi dan kemudahan akses informasi bagi seluruh warga dan masyarakat luas mengenai program kerja, kegiatan, dan pembangunan di desa kita tercinta.",
  stats: [
    { id: 1, num: "3.689", label: "Total Penduduk", subLaki: "1.874", subPerempuan: "1.815" },
    { id: 2, num: "823", label: "Kepala Keluarga" },
    { id: 3, num: "3", label: "Dusun" },
    { id: 4, num: "16", label: "Rukun Tetangga (RT)" }
  ]
};

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [isDbConnected, setIsDbConnected] = useState(false); 
  const [dbError, setDbError] = useState(""); 
  const [currentPage, setCurrentPage] = useState('beranda');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // State Active Tabs
  const [activeProfilTab, setActiveProfilTab] = useState<any>(null);
  const [activePemerintahTab, setActivePemerintahTab] = useState('perangkat');
  const [activeBeritaTab, setActiveBeritaTab] = useState('list-berita');
  
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
      return localStorage.getItem('upang_mulya_admin') === 'true';
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

  const [daftarBerita, setDaftarBerita] = useState(() => getInitialData('upang_mulya_berita', initialBerita));
  const [dataGrafik, setDataGrafik] = useState(() => getInitialData('upang_mulya_grafik', initialGrafik));
  const [daftarAgenda, setDaftarAgenda] = useState(() => getInitialData('upang_mulya_agenda', initialAgenda));
  const [daftarPerangkat, setDaftarPerangkat] = useState(() => getInitialData('upang_mulya_perangkat', initialPerangkat));
  const [daftarLembaga, setDaftarLembaga] = useState(() => getInitialData('upang_mulya_lembaga', initialLembaga));
  const [daftarProfil, setDaftarProfil] = useState(() => getInitialData('upang_mulya_profil', initialProfil));
  const [dataBeranda, setDataBeranda] = useState(() => getInitialData('upang_mulya_beranda', initialBeranda));

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
        console.error("Auth error:", error.message);
        if (error.code === 'auth/operation-not-allowed' || error.code === 'auth/configuration-not-found') {
          setDbError("Autentikasi Firebase gagal. Pastikan metode 'Anonymous Login' sudah Anda aktifkan di menu Authentication Firebase Console.");
        } else {
          setDbError(`Firebase Error: ${error.message}`);
        }
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
    // PENTING: Tunggu hingga Firebase database DAN user auth token (anonymous/custom) tersedia.
    // Jika tidak, permintaan baca data ini akan diblokir oleh aturan izin (permission denied).
    if (!db || !user) return; 

    const handleServerData = (snap: any, stateSetter: any, storageKey: string) => {
      setIsDbConnected(true); 
      setDbError(""); 
      if (snap.exists()) {
        const val = snap.data().value;
        const parsedData = typeof val === 'string' ? JSON.parse(val) : val;
        
        stateSetter(parsedData);
        if (typeof window !== 'undefined') {
          localStorage.setItem(storageKey, JSON.stringify(parsedData));
        }
      }
    };

    const handleServerError = (err: any) => {
      console.error("Gagal sinkronisasi data:", err);
      setIsDbConnected(false);
      if (err.code === 'permission-denied') {
        setDbError("Akses Database Ditolak! Masuk ke Firebase Console Anda, buka menu Firestore Database, klik tab 'Rules', lalu ubah isinya menjadi 'allow read, write: if true;' dan klik Publish.");
      }
    };

    const unsubBeranda = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'upang_mulya_beranda', 'main'), 
      (snap) => handleServerData(snap, setDataBeranda, 'upang_mulya_beranda'), handleServerError
    );

    const unsubBerita = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'upang_mulya_berita', 'main'), 
      (snap) => handleServerData(snap, setDaftarBerita, 'upang_mulya_berita'), handleServerError
    );
    
    const unsubGrafik = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'upang_mulya_grafik', 'main'), 
      (snap) => handleServerData(snap, setDataGrafik, 'upang_mulya_grafik'), handleServerError
    );

    const unsubAgenda = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'upang_mulya_agenda', 'main'), 
      (snap) => handleServerData(snap, setDaftarAgenda, 'upang_mulya_agenda'), handleServerError
    );

    const unsubPerangkat = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'upang_mulya_perangkat', 'main'), 
      (snap) => handleServerData(snap, setDaftarPerangkat, 'upang_mulya_perangkat'), handleServerError
    );

    const unsubLembaga = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'upang_mulya_lembaga', 'main'), 
      (snap) => handleServerData(snap, setDaftarLembaga, 'upang_mulya_lembaga'), handleServerError
    );

    const unsubProfil = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'upang_mulya_profil', 'main'), 
      (snap) => handleServerData(snap, setDaftarProfil, 'upang_mulya_profil'), handleServerError
    );

    return () => {
      unsubBeranda(); unsubBerita(); unsubGrafik(); unsubAgenda(); unsubPerangkat(); unsubLembaga(); unsubProfil();
    };
  }, [user]); // Dependensi user ditambahkan agar fungsi berjalan HANYA jika terautentikasi

  // ================= UPDATE FUNCTIONS =================
  const updateBeranda = async (newData: any) => {
    setDataBeranda(newData);
    if (typeof window !== 'undefined') localStorage.setItem('upang_mulya_beranda', JSON.stringify(newData));
    if(db && user) {
      try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'upang_mulya_beranda', 'main'), { value: JSON.stringify(newData) }); } catch(e) { console.error(e); }
    } else {
      showAlert("Perubahan disimpan secara LOKAL. Aktifkan koneksi database untuk mensinkronisasi.");
    }
  };
  
  const updateBerita = async (newData: any) => {
    setDaftarBerita(newData);
    if (typeof window !== 'undefined') localStorage.setItem('upang_mulya_berita', JSON.stringify(newData));
    if(db && user) {
      try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'upang_mulya_berita', 'main'), { value: JSON.stringify(newData) }); } catch(e) { console.error(e); }
    }
  };
  
  const updateGrafik = async (newData: any) => {
    setDataGrafik(newData);
    if (typeof window !== 'undefined') localStorage.setItem('upang_mulya_grafik', JSON.stringify(newData));
    if(db && user) {
      try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'upang_mulya_grafik', 'main'), { value: JSON.stringify(newData) }); } catch(e) { console.error(e); }
    }
  };

  const updateAgenda = async (newData: any) => {
    setDaftarAgenda(newData);
    if (typeof window !== 'undefined') localStorage.setItem('upang_mulya_agenda', JSON.stringify(newData));
    if(db && user) {
      try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'upang_mulya_agenda', 'main'), { value: JSON.stringify(newData) }); } catch(e) { console.error(e); }
    }
  };

  const updatePerangkat = async (newData: any) => {
    setDaftarPerangkat(newData);
    if (typeof window !== 'undefined') localStorage.setItem('upang_mulya_perangkat', JSON.stringify(newData));
    if(db && user) {
      try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'upang_mulya_perangkat', 'main'), { value: JSON.stringify(newData) }); } catch(e) { console.error(e); }
    }
  };
  const updateLembaga = async (newData: any) => {
    setDaftarLembaga(newData);
    if (typeof window !== 'undefined') localStorage.setItem('upang_mulya_lembaga', JSON.stringify(newData));
    if(db && user) {
      try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'upang_mulya_lembaga', 'main'), { value: JSON.stringify(newData) }); } catch(e) { console.error(e); }
    }
  };
  const updateProfil = async (newData: any) => {
    setDaftarProfil(newData);
    if (typeof window !== 'undefined') localStorage.setItem('upang_mulya_profil', JSON.stringify(newData));
    if(db && user) {
      try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'upang_mulya_profil', 'main'), { value: JSON.stringify(newData) }); } catch(e) { console.error(e); }
    }
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
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0); 
    }
  }, [currentPage, activeProfilTab, activePemerintahTab, activeBeritaTab]);

  useEffect(() => { 
    if (typeof window !== 'undefined') {
      try { localStorage.setItem('upang_mulya_admin', isAdmin.toString()); } catch(e){} 
    }
  }, [isAdmin]);

  const navigateTo = (page: string, tabId: any = null) => {
    setCurrentPage(page);
    if (page === 'profil' && tabId !== null) setActiveProfilTab(tabId);
    if (page === 'pemerintah' && tabId !== null) setActivePemerintahTab(tabId);
    if (page === 'berita' && tabId !== null) setActiveBeritaTab(tabId);

    setIsMobileMenuOpen(false);
    setIsMobileProfilOpen(false);
    setIsDesktopProfilOpen(false);
    setIsMobilePemerintahOpen(false);
    setIsDesktopPemerintahOpen(false);
    setIsMobileBeritaOpen(false);
    setIsDesktopBeritaOpen(false);
  };

  const handleLogin = (e: any) => {
    e.preventDefault();
    const username = e.target.username.value;
    const password = e.target.password.value;
    
    if (username === 'Admin' && password === 'admin2311') {
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
    { id: 'perangkat', label: 'Perangkat Desa' },
    { id: 'bpd', label: 'BPD' },
    { id: 'pkk', label: 'PKK' },
    { id: 'kadus', label: 'Kepala Dusun' },
    { id: 'rt', label: 'Ketua RT' }
  ];

  const menuBerita = [
    { id: 'list-berita', label: 'Berita & Informasi' },
    { id: 'grafik-penduduk', label: 'Grafik Penduduk' }
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50 text-gray-800 relative selection:bg-emerald-200 selection:text-emerald-900">
      
      {/* Dialog Kustom (Pengganti Alert & Confirm) */}
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
                className={`px-5 py-2.5 text-white rounded-xl font-bold shadow-lg transition ${dialog.type === 'confirm' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
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
          .custom-scrollbar::-webkit-scrollbar {
            height: 12px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f1f1; 
            border-radius: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #d1d5db; 
            border-radius: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #9ca3af; 
          }
          @keyframes growBar {
            from { width: 0; }
          }
          .animate-grow {
            animation: growBar 1.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
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
                    setIsDesktopPemerintahOpen(false);
                    setIsDesktopBeritaOpen(false);
                    if (currentPage === 'profil') {
                      setIsDesktopProfilOpen(!isDesktopProfilOpen);
                    } else {
                      navigateTo('profil', daftarProfil[0]?.id);
                      setIsDesktopProfilOpen(true);
                    }
                  }}
                  className={`px-5 py-2.5 rounded-xl font-bold flex items-center transition-all duration-300 text-sm tracking-wide ${
                    currentPage === 'profil'
                      ? 'bg-white text-emerald-900 shadow-md'
                      : 'text-white hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Info className="w-4 h-4 mr-2" />
                  Profil Desa
                  <ChevronDown className={`w-4 h-4 ml-1 opacity-70 transition-transform duration-300 ${isDesktopProfilOpen ? 'rotate-180' : ''}`} />
                </button>

                <div className={`absolute top-full left-0 mt-2 w-56 bg-white rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.15)] border border-gray-100 transition-all duration-300 transform origin-top z-50 overflow-hidden ${
                  isDesktopProfilOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-2'
                }`}>
                  <div className="flex flex-col py-1.5">
                    {daftarProfil.map((profil: any) => (
                      <button
                        key={profil.id}
                        onClick={(e: any) => {
                          e.stopPropagation();
                          navigateTo('profil', profil.id);
                        }}
                        className={`text-left px-5 py-3 text-sm font-bold transition-all duration-200 relative overflow-hidden ${
                           activeProfilTab === profil.id && currentPage === 'profil'
                             ? 'text-emerald-700 bg-emerald-50/80'
                             : 'text-gray-600 hover:bg-gray-50 hover:text-emerald-600'
                        }`}
                      >
                         {activeProfilTab === profil.id && currentPage === 'profil' && (
                           <span className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-emerald-600"></span>
                         )}
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
                    setIsDesktopProfilOpen(false);
                    setIsDesktopBeritaOpen(false);
                    if (currentPage === 'pemerintah') {
                      setIsDesktopPemerintahOpen(!isDesktopPemerintahOpen);
                    } else {
                      navigateTo('pemerintah', 'perangkat');
                      setIsDesktopPemerintahOpen(true);
                    }
                  }}
                  className={`px-5 py-2.5 rounded-xl font-bold flex items-center transition-all duration-300 text-sm tracking-wide ${
                    currentPage === 'pemerintah'
                      ? 'bg-white text-emerald-900 shadow-md'
                      : 'text-white hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Pemerintah Desa
                  <ChevronDown className={`w-4 h-4 ml-1 opacity-70 transition-transform duration-300 ${isDesktopPemerintahOpen ? 'rotate-180' : ''}`} />
                </button>

                <div className={`absolute top-full left-0 mt-2 w-56 bg-white rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.15)] border border-gray-100 transition-all duration-300 transform origin-top z-50 overflow-hidden ${
                  isDesktopPemerintahOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-2'
                }`}>
                  <div className="flex flex-col py-1.5">
                    {menuPemerintah.map((menu) => (
                      <button
                        key={menu.id}
                        onClick={(e: any) => {
                          e.stopPropagation();
                          navigateTo('pemerintah', menu.id);
                        }}
                        className={`text-left px-5 py-3 text-sm font-bold transition-all duration-200 relative overflow-hidden ${
                           activePemerintahTab === menu.id && currentPage === 'pemerintah'
                             ? 'text-emerald-700 bg-emerald-50/80'
                             : 'text-gray-600 hover:bg-gray-50 hover:text-emerald-600'
                        }`}
                      >
                         {activePemerintahTab === menu.id && currentPage === 'pemerintah' && (
                           <span className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-emerald-600"></span>
                         )}
                         {menu.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dropdown Berita & Grafik */}
              <div className="relative" onClick={(e: any) => e.stopPropagation()}>
                <button
                  onClick={() => {
                    setIsDesktopProfilOpen(false);
                    setIsDesktopPemerintahOpen(false);
                    if (currentPage === 'berita') {
                      setIsDesktopBeritaOpen(!isDesktopBeritaOpen);
                    } else {
                      navigateTo('berita', 'list-berita');
                      setIsDesktopBeritaOpen(true);
                    }
                  }}
                  className={`px-5 py-2.5 rounded-xl font-bold flex items-center transition-all duration-300 text-sm tracking-wide ${
                    currentPage === 'berita'
                      ? 'bg-white text-emerald-900 shadow-md'
                      : 'text-white hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Newspaper className="w-4 h-4 mr-2" />
                  Berita
                  <ChevronDown className={`w-4 h-4 ml-1 opacity-70 transition-transform duration-300 ${isDesktopBeritaOpen ? 'rotate-180' : ''}`} />
                </button>

                <div className={`absolute top-full left-0 mt-2 w-56 bg-white rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.15)] border border-gray-100 transition-all duration-300 transform origin-top z-50 overflow-hidden ${
                  isDesktopBeritaOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-2'
                }`}>
                  <div className="flex flex-col py-1.5">
                    {menuBerita.map((menu) => (
                      <button
                        key={menu.id}
                        onClick={(e: any) => {
                          e.stopPropagation();
                          navigateTo('berita', menu.id);
                        }}
                        className={`text-left px-5 py-3 text-sm font-bold transition-all duration-200 relative overflow-hidden ${
                           activeBeritaTab === menu.id && currentPage === 'berita'
                             ? 'text-emerald-700 bg-emerald-50/80'
                             : 'text-gray-600 hover:bg-gray-50 hover:text-emerald-600'
                        }`}
                      >
                         {activeBeritaTab === menu.id && currentPage === 'berita' && (
                           <span className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-emerald-600"></span>
                         )}
                         <div className="flex items-center">
                           {menu.id === 'list-berita' ? <Newspaper className="w-4 h-4 mr-2 opacity-70" /> : <PieChart className="w-4 h-4 mr-2 opacity-70" />}
                           {menu.label}
                         </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <NavButton active={currentPage === 'kontak'} onClick={() => navigateTo('kontak')} icon={<Phone className="w-4 h-4 mr-2" />}>Kontak</NavButton>
              
              {/* Tombol Admin Panel */}
              <div className="pl-2 ml-1 border-l border-white/20 flex items-center gap-2">
                {isAdmin ? (
                  <>
                    <button onClick={handleLogout} className="flex items-center text-sm font-bold bg-rose-500 hover:bg-rose-600 text-white px-5 py-2.5 rounded-xl transition shadow-[0_0_15px_rgba(244,63,94,0.4)]">
                      <LogOut className="w-4 h-4 mr-2" /> Keluar
                    </button>
                  </>
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
                  <>
                    <button onClick={handleLogout} className="p-2.5 bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)] rounded-xl text-white" title="Keluar">
                      <LogOut className="w-5 h-5" />
                    </button>
                  </>
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
              
              {/* Dropdown Profil Desa Mobile */}
              <div>
                <button
                  onClick={() => {
                    setIsMobileProfilOpen(!isMobileProfilOpen);
                    setIsMobilePemerintahOpen(false);
                    setIsMobileBeritaOpen(false);
                  }}
                  className={`flex items-center justify-between w-full text-left px-5 py-4 rounded-xl text-lg font-bold transition-all ${
                    currentPage === 'profil' || isMobileProfilOpen
                      ? 'bg-emerald-800 text-white border-l-4 border-emerald-400 shadow-inner'
                      : 'text-emerald-100 hover:bg-emerald-800/80 hover:text-white'
                  }`}
                >
                  <span>Profil Desa</span>
                  <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isMobileProfilOpen ? 'rotate-180' : ''}`} />
                </button>
                {isMobileProfilOpen && (
                  <div className="flex flex-col bg-emerald-900/50 rounded-xl mt-2 mx-2 overflow-hidden border border-white/5 animate-in slide-in-from-top-2 duration-200">
                    {daftarProfil.map((profil: any) => (
                      <button
                        key={profil.id}
                        onClick={() => navigateTo('profil', profil.id)}
                        className={`text-left px-6 py-3.5 text-sm font-bold transition-colors border-l-2 ${
                          activeProfilTab === profil.id && currentPage === 'profil'
                            ? 'border-emerald-400 text-white bg-emerald-800/50'
                            : 'border-transparent text-emerald-200 hover:bg-emerald-800 hover:text-white'
                        }`}
                      >
                        {profil.judul}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Dropdown Pemerintah Desa Mobile */}
              <div>
                <button
                  onClick={() => {
                    setIsMobilePemerintahOpen(!isMobilePemerintahOpen);
                    setIsMobileProfilOpen(false);
                    setIsMobileBeritaOpen(false);
                  }}
                  className={`flex items-center justify-between w-full text-left px-5 py-4 rounded-xl text-lg font-bold transition-all ${
                    currentPage === 'pemerintah' || isMobilePemerintahOpen
                      ? 'bg-emerald-800 text-white border-l-4 border-emerald-400 shadow-inner'
                      : 'text-emerald-100 hover:bg-emerald-800/80 hover:text-white'
                  }`}
                >
                  <span>Pemerintah Desa</span>
                  <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isMobilePemerintahOpen ? 'rotate-180' : ''}`} />
                </button>
                {isMobilePemerintahOpen && (
                  <div className="flex flex-col bg-emerald-900/50 rounded-xl mt-2 mx-2 overflow-hidden border border-white/5 animate-in slide-in-from-top-2 duration-200">
                    {menuPemerintah.map((menu) => (
                      <button
                        key={menu.id}
                        onClick={() => navigateTo('pemerintah', menu.id)}
                        className={`text-left px-6 py-3.5 text-sm font-bold transition-colors border-l-2 ${
                          activePemerintahTab === menu.id && currentPage === 'pemerintah'
                            ? 'border-emerald-400 text-white bg-emerald-800/50'
                            : 'border-transparent text-emerald-200 hover:bg-emerald-800 hover:text-white'
                        }`}
                      >
                        {menu.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Dropdown Berita Mobile */}
              <div>
                <button
                  onClick={() => {
                    setIsMobileBeritaOpen(!isMobileBeritaOpen);
                    setIsMobileProfilOpen(false);
                    setIsMobilePemerintahOpen(false);
                  }}
                  className={`flex items-center justify-between w-full text-left px-5 py-4 rounded-xl text-lg font-bold transition-all ${
                    currentPage === 'berita' || isMobileBeritaOpen
                      ? 'bg-emerald-800 text-white border-l-4 border-emerald-400 shadow-inner'
                      : 'text-emerald-100 hover:bg-emerald-800/80 hover:text-white'
                  }`}
                >
                  <span>Berita & Informasi</span>
                  <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isMobileBeritaOpen ? 'rotate-180' : ''}`} />
                </button>
                {isMobileBeritaOpen && (
                  <div className="flex flex-col bg-emerald-900/50 rounded-xl mt-2 mx-2 overflow-hidden border border-white/5 animate-in slide-in-from-top-2 duration-200">
                    {menuBerita.map((menu) => (
                      <button
                        key={menu.id}
                        onClick={() => navigateTo('berita', menu.id)}
                        className={`text-left px-6 py-3.5 text-sm font-bold transition-colors border-l-2 ${
                          activeBeritaTab === menu.id && currentPage === 'berita'
                            ? 'border-emerald-400 text-white bg-emerald-800/50'
                            : 'border-transparent text-emerald-200 hover:bg-emerald-800 hover:text-white'
                        }`}
                      >
                        {menu.label}
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
             <div className="bg-rose-200 text-rose-800 border border-rose-400 px-4 py-2 rounded-xl text-xs font-bold w-full max-w-2xl mt-1 text-left sm:text-center shadow-sm">
               ⚠️ {dbError}
             </div>
           )}
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-grow">
        {currentPage === 'beranda' && (
          <HalamanBeranda 
            navigateTo={navigateTo} 
            isAdmin={isAdmin} 
            dataBeranda={dataBeranda} 
            setDataBeranda={updateBeranda} 
            daftarAgenda={daftarAgenda}
            setDaftarAgenda={updateAgenda}
            dataGrafik={dataGrafik}
            showConfirm={showConfirm}
            showAlert={showAlert}
          />
        )}
        {currentPage === 'profil' && (
          <HalamanProfilDesa 
            isAdmin={isAdmin}
            daftarProfil={daftarProfil}
            setDaftarProfil={updateProfil}
            initialTabId={activeProfilTab}
            navigateTo={navigateTo}
            showConfirm={showConfirm}
          />
        )}
        {currentPage === 'pemerintah' && (
          <HalamanPemerintahan 
            isAdmin={isAdmin}
            activeTab={activePemerintahTab}
            daftarPerangkat={daftarPerangkat}
            setDaftarPerangkat={updatePerangkat}
            daftarLembaga={daftarLembaga}
            setDaftarLembaga={updateLembaga}
            showConfirm={showConfirm}
          />
        )}
        {currentPage === 'berita' && (
          <HalamanBerita 
            isAdmin={isAdmin}
            activeTab={activeBeritaTab}
            daftarBerita={daftarBerita} 
            setDaftarBerita={updateBerita}
            dataGrafik={dataGrafik}
            setGrafik={updateGrafik}
            showConfirm={showConfirm}
          />
        )}
        {currentPage === 'kontak' && <HalamanKontak />}
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
                <li><button onClick={() => navigateTo('berita', 'list-berita')} className="text-gray-400 hover:text-emerald-400 font-medium flex items-center transition duration-200 hover:translate-x-2"><ChevronRight className="w-4 h-4 mr-2 text-emerald-500"/> Berita Desa</button></li>
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
            <p>&copy; {new Date().getFullYear()} Pemerintah Desa Upang Mulya. Seluruh hak cipta dilindungi.</p>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
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
                <label className="block text-sm text-gray-500 mb-2">Hubungi admin untuk mendapatkan username dan password</label>
                <input 
                  type="text" 
                  name="username" 
                  required
                  className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium" 
                  placeholder="Masukkan username"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
                <input 
                  type="password" 
                  name="password" 
                  required
                  className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium" 
                  placeholder="Masukkan password"
                />
              </div>
              <button 
                type="submit" 
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-[0_8px_20px_rgba(5,150,105,0.3)] hover:shadow-[0_8px_25px_rgba(5,150,105,0.4)] hover:-translate-y-0.5 mt-4"
              >
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

function HalamanBeranda({ navigateTo, isAdmin, dataBeranda, setDataBeranda, daftarAgenda, setDaftarAgenda, dataGrafik, showConfirm, showAlert }: any) {
  const [showEditor, setShowEditor] = useState(false);
  const [editForm, setEditForm] = useState(dataBeranda);
  
  const [showEditorAgenda, setShowEditorAgenda] = useState(false);
  const [editDataAgenda, setEditDataAgenda] = useState<any>({ id: null, judul: '', lokasi: '', tanggal: '' });

  const handleHeroBgChange = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      compressImage(file, 800, false, (base64: any) => {
        setEditForm((prev: any) => ({ ...prev, heroBg: base64 }));
      });
      e.target.value = '';
    }
  };

  const handleLogoHeroChange = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      compressImage(file, 300, true, (base64: any) => {
        setEditForm((prev: any) => ({ ...prev, logoHero: base64 }));
      });
      e.target.value = '';
    }
  };

  const handleHeaderLogoChange = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      compressImage(file, 200, true, (base64: any) => {
        setEditForm((prev: any) => ({ ...prev, headerLogo: base64 }));
      });
      e.target.value = '';
    }
  };

  const handleFotoKadesUpload = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      compressImage(file, 300, false, (base64: any) => {
        setEditForm((prev: any) => ({ ...prev, fotoKades: base64 }));
      });
      e.target.value = '';
    }
  };

  const handleStatChange = (id: any, field: any, value: any) => {
    setEditForm((prev: any) => ({
      ...prev,
      stats: prev.stats.map((s: any) => s.id === id ? { ...s, [field]: value } : s)
    }));
  };

  const handleSave = (e: any) => {
    e.preventDefault();
    setDataBeranda(editForm);
    setShowEditor(false);
    showAlert("Perubahan selesai. Cek hasilnya!");
  };

  // ----- Logika Editor Agenda -----
  const openEditorAgenda = (agenda: any = null) => {
    if (agenda) {
      setEditDataAgenda(agenda);
    } else {
      setEditDataAgenda({ id: null, judul: '', lokasi: '', tanggal: '' });
    }
    setShowEditorAgenda(true);
  };

  const handleSaveAgenda = (e: any) => {
    e.preventDefault();
    if (editDataAgenda.id) {
      setDaftarAgenda(daftarAgenda.map((a: any) => a.id === editDataAgenda.id ? editDataAgenda : a));
    } else {
      setDaftarAgenda([...daftarAgenda, { ...editDataAgenda, id: Date.now() }]);
    }
    setShowEditorAgenda(false);
  };

  const handleDeleteAgenda = (id: any) => {
    showConfirm('Yakin ingin menghapus agenda ini?', () => {
      setDaftarAgenda(daftarAgenda.filter((a: any) => a.id !== id));
    });
  };

  // ----- Logika Kalender -----
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const currentDay = today.getDate();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  
  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  // Filter agenda untuk bulan ini (disortir berdasarkan tanggal)
  const agendaBulanIni = daftarAgenda.filter((a: any) => {
    if (!a.tanggal) return false;
    const d = new Date(a.tanggal);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).sort((a: any, b: any) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());

  return (
    <div className="animate-in fade-in duration-700">
      <section className="relative min-h-[100svh] md:min-h-[700px] flex items-center justify-center overflow-hidden py-32 md:py-20">
        <div className="absolute inset-0 z-0">
          <img 
            src={dataBeranda.heroBg} 
            alt="Pemandangan Desa" 
            className="w-full h-full object-cover transition-transform duration-[10s] hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/70 to-transparent"></div>
        </div>

        {isAdmin && (
          <div className="absolute top-6 left-6 z-30 group flex items-center">
             <button 
               onClick={() => { setEditForm(dataBeranda); setShowEditor(true); }} 
               className="cursor-pointer bg-white/90 backdrop-blur hover:bg-white text-emerald-800 p-3.5 rounded-2xl font-bold flex items-center justify-center shadow-[0_8px_30px_rgba(0,0,0,0.3)] transition-all hover:scale-110 border border-white/50"
             >
                <Edit className="w-6 h-6 text-emerald-600" /> 
             </button>
             <div className="absolute left-full ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white text-emerald-800 px-4 py-2 rounded-xl font-bold shadow-lg pointer-events-none whitespace-nowrap">
               Edit Konten Beranda
             </div>
          </div>
        )}
        
        <div className="container mx-auto px-4 lg:px-8 relative z-10 text-center text-white pb-10">
          
          {dataBeranda.logoHero && (
            <img 
              src={dataBeranda.logoHero} 
              alt="Logo" 
              className="h-28 md:h-36 mx-auto drop-shadow-2xl object-contain animate-float" 
            />
          )}

          <div className="w-full max-w-4xl mx-auto overflow-hidden relative mb-6 mt-4 py-2">
            <div className="animate-roll whitespace-nowrap">
              <span 
                className="text-xl md:text-2xl lg:text-3xl font-black tracking-[0.15em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]"
              >
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
            <button 
              onClick={() => navigateTo('profil')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg py-4 px-10 rounded-2xl shadow-[0_10px_25px_rgba(5,150,105,0.4)] transition-all transform hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(5,150,105,0.5)] border border-emerald-500"
            >
              Profil Desa
            </button>
            <button 
              onClick={() => navigateTo('berita', 'list-berita')}
              className="bg-white hover:bg-gray-50 text-emerald-900 font-bold text-lg py-4 px-10 rounded-2xl shadow-[0_10px_25px_rgba(0,0,0,0.2)] transition-all transform hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(0,0,0,0.3)] border border-transparent"
            >
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

      <section className="py-20 relative bg-emerald-900 overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1592982537447-6f2a6a0a091c?w=1920&q=80')", backgroundSize: 'cover', backgroundPosition: 'center', filter: 'grayscale(100%)' }}></div>
        
        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-8 text-center">
            {dataBeranda.stats.map((stat: any) => {
              // --- SINKRONISASI DATA GRAFIK KE TOTAL PENDUDUK ---
              let displayNum = stat.num;
              let displayLaki = stat.subLaki;
              let displayPerempuan = stat.subPerempuan;

              if (stat.id === 1 && dataGrafik) {
                const total = (dataGrafik.lakiLaki || 0) + (dataGrafik.perempuan || 0);
                displayNum = total.toLocaleString('id-ID');
                displayLaki = (dataGrafik.lakiLaki || 0).toLocaleString('id-ID');
                displayPerempuan = (dataGrafik.perempuan || 0).toLocaleString('id-ID');
              }

              return (
                <div key={stat.id} className="p-4 sm:p-6 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.1)] hover:bg-white/10 transition-colors flex flex-col justify-center h-full relative overflow-hidden">
                  <div className="text-3xl sm:text-5xl font-extrabold text-white mb-1 sm:mb-2 drop-shadow-md">{displayNum}</div>
                  <div className="text-emerald-200 font-bold text-xs sm:text-lg tracking-wide">{stat.label}</div>

                  {stat.id === 1 && (
                    <div className="flex justify-center gap-2 sm:gap-6 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/10 w-full">
                      <div className="flex flex-col items-center">
                        <span className="font-extrabold text-white text-sm sm:text-xl">{displayLaki}</span>
                        <span className="text-[9px] sm:text-[11px] text-emerald-100/90 font-bold uppercase tracking-wider mt-0.5 text-center break-words">Laki-laki</span>
                      </div>
                      <div className="w-px bg-white/20"></div>
                      <div className="flex flex-col items-center">
                        <span className="font-extrabold text-white text-sm sm:text-xl">{displayPerempuan}</span>
                        <span className="text-[9px] sm:text-[11px] text-emerald-100/90 font-bold uppercase tracking-wider mt-0.5 text-center break-words">Perempuan</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* KALENDER DESA SECTION */}
      <section className="py-20 bg-white border-t border-gray-100 relative">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-emerald-600 font-bold tracking-widest uppercase text-sm mb-2 block">Agenda & Waktu</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6 tracking-tight">Kalender Desa</h2>
            <div className="w-24 h-1.5 bg-gradient-to-r from-emerald-600 to-emerald-400 mx-auto rounded-full"></div>
          </div>

          <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-10 lg:gap-16">
            {/* Tampilan Kalender (Kiri) */}
            <div className="w-full lg:w-1/2 bg-white rounded-3xl shadow-[0_15px_40px_rgba(0,0,0,0.08)] border border-gray-100 p-6 sm:p-8 overflow-hidden">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
                <h3 className="text-2xl font-extrabold text-gray-900 flex items-center">
                  <CalendarDays className="w-7 h-7 text-emerald-600 mr-3" />
                  {monthNames[currentMonth]} {currentYear}
                </h3>
                <div className="flex gap-2">
                  <button className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-emerald-600 transition"><ChevronRight className="w-5 h-5 rotate-180"/></button>
                  <button className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-emerald-600 transition"><ChevronRight className="w-5 h-5"/></button>
                </div>
              </div>
              
              <div className="grid grid-cols-7 gap-2 sm:gap-4 mb-4">
                {dayNames.map((day, i) => (
                  <div key={i} className={`text-center text-sm font-bold ${i === 0 ? 'text-rose-500' : 'text-gray-400'}`}>
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-2 sm:gap-4">
                {calendarDays.map((day, idx) => {
                  const isToday = day === currentDay;
                  // Mengecek apakah hari ini ada dalam data agenda (dinamis)
                  const hasAgenda = daftarAgenda.some((a: any) => {
                    if(!a.tanggal) return false;
                    const d = new Date(a.tanggal);
                    return d.getDate() === day && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
                  });
                  const isSunday = (idx % 7) === 0;

                  return (
                    <div key={idx} className="aspect-square flex flex-col items-center justify-center relative">
                      {day && (
                        <div 
                          className={`w-full h-full flex items-center justify-center rounded-xl font-bold text-sm sm:text-base transition-all cursor-pointer ${
                            isToday 
                              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/40 transform scale-110 z-10' 
                              : hasAgenda
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                                : isSunday 
                                  ? 'text-rose-500 hover:bg-gray-50' 
                                  : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {day}
                          {hasAgenda && !isToday && (
                            <span className="absolute bottom-1.5 w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Agenda List (Kanan) */}
            <div className="w-full lg:w-1/2 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-extrabold text-gray-900 flex items-center">
                   <Activity className="w-6 h-6 text-emerald-600 mr-3" />
                   Agenda Bulan Ini
                </h3>
                {isAdmin && (
                  <button onClick={() => openEditorAgenda()} className="text-sm bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-3 py-1.5 rounded-lg font-bold flex items-center transition shadow-sm">
                    <Plus className="w-4 h-4 mr-1" /> Tambah Agenda
                  </button>
                )}
              </div>
              
              <div className="space-y-4 flex-grow overflow-y-auto custom-scrollbar pr-2 max-h-[380px]">
                {agendaBulanIni.length === 0 ? (
                   <div className="text-gray-500 italic py-10 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">Belum ada agenda pada bulan ini.</div>
                ) : (
                  agendaBulanIni.map((agenda: any) => {
                    const d = new Date(agenda.tanggal);
                    const tgl = String(d.getDate()).padStart(2, '0');
                    return (
                      <div key={agenda.id} className="bg-white border border-gray-200 rounded-2xl p-5 flex items-start hover:shadow-md transition hover:border-emerald-200 relative group">
                        {isAdmin && (
                          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openEditorAgenda(agenda)} className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-md transition" title="Edit Agenda"><Edit className="w-4 h-4"/></button>
                            <button onClick={() => handleDeleteAgenda(agenda.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-md transition" title="Hapus Agenda"><Trash2 className="w-4 h-4"/></button>
                          </div>
                        )}
                        <div className="bg-emerald-50 text-emerald-700 w-16 h-16 rounded-xl flex flex-col items-center justify-center font-extrabold shadow-sm border border-emerald-100 flex-shrink-0 mr-5">
                          <span className="text-xs uppercase tracking-widest text-emerald-500">{monthNames[d.getMonth()].substring(0,3)}</span>
                          <span className="text-2xl leading-none">{tgl}</span>
                        </div>
                        <div className="pr-12">
                          <h4 className="font-extrabold text-gray-900 text-lg leading-tight">{agenda.judul}</h4>
                          <p className="text-gray-600 text-sm mt-1.5 font-medium flex items-center"><MapPin className="w-4 h-4 mr-1 text-emerald-500"/> {agenda.lokasi}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-100">
                <button onClick={() => navigateTo('berita', 'list-berita')} className="text-emerald-600 font-extrabold hover:text-emerald-800 flex items-center transition group">
                   Lihat semua kegiatan <ArrowRight className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition" />
                </button>
              </div>
            </div>

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
                        <p className="text-sm text-gray-500 mt-2 font-medium">Logo untuk navigasi pojok kiri atas. Bebas atau biarkan default.</p>
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
                        <p className="text-sm text-gray-500 mt-2 font-medium">Bisa menggunakan file berformat PNG transparan.</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Nama Desa</label>
                    <input 
                      type="text" required
                      value={editForm.namaDesa}
                      onChange={(e) => setEditForm({...editForm, namaDesa: e.target.value})}
                      className="w-full px-5 py-3 bg-white border border-gray-300 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium" 
                    />
                  </div>
                  <div className="col-span-full">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Deskripsi / Sub-judul (Gunakan Enter untuk baris baru)</label>
                    <textarea 
                      required rows={3}
                      value={editForm.deskripsiDesa}
                      onChange={(e) => setEditForm({...editForm, deskripsiDesa: e.target.value})}
                      className="w-full px-5 py-3 bg-white border border-gray-300 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium leading-relaxed" 
                    ></textarea>
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
                    <input 
                      type="text" required
                      value={editForm.namaKades}
                      onChange={(e) => setEditForm({...editForm, namaKades: e.target.value})}
                      className="w-full px-5 py-3 bg-white border border-gray-300 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Jabatan (Teks)</label>
                    <input 
                      type="text" required
                      value={editForm.jabatanKades}
                      onChange={(e) => setEditForm({...editForm, jabatanKades: e.target.value})}
                      className="w-full px-5 py-3 bg-white border border-gray-300 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium" 
                    />
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
                    <textarea 
                      required rows={6}
                      value={editForm.sambutanKades}
                      onChange={(e) => setEditForm({...editForm, sambutanKades: e.target.value})}
                      className="w-full px-5 py-3 bg-white border border-gray-300 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium leading-relaxed" 
                    ></textarea>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                <h4 className="font-extrabold text-lg text-emerald-800 mb-4 flex items-center">
                   <span className="w-6 h-1 bg-emerald-500 rounded-full mr-3"></span> Pengaturan Angka Statistik Dasar
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {editForm.stats.map((stat: any, index: number) => {
                    const isPopulasi = stat.id === 1;
                    
                    // Logic Sinkronisasi Display Input Editor
                    let displayNum = stat.num;
                    let displayLaki = stat.subLaki || '';
                    let displayPerempuan = stat.subPerempuan || '';

                    if (isPopulasi && dataGrafik) {
                      const total = (dataGrafik.lakiLaki || 0) + (dataGrafik.perempuan || 0);
                      displayNum = total.toLocaleString('id-ID');
                      displayLaki = (dataGrafik.lakiLaki || 0).toLocaleString('id-ID');
                      displayPerempuan = (dataGrafik.perempuan || 0).toLocaleString('id-ID');
                    }

                    return (
                    <div key={stat.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-3">
                      <div className="font-bold text-gray-500 text-sm border-b pb-1">Kolom {index + 1}</div>
                      <div>
                         <label className="block text-xs font-bold text-gray-700 mb-1">Angka / Jumlah</label>
                         <input 
                           type="text" required
                           value={displayNum}
                           onChange={(e) => handleStatChange(stat.id, 'num', e.target.value)}
                           disabled={isPopulasi}
                           className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 ${isPopulasi ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`} 
                         />
                      </div>
                      <div>
                         <label className="block text-xs font-bold text-gray-700 mb-1">Label (Contoh: Total Penduduk)</label>
                         <input 
                           type="text" required
                           value={stat.label}
                           onChange={(e) => handleStatChange(stat.id, 'label', e.target.value)}
                           className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" 
                         />
                      </div>
                      {isPopulasi && (
                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100 mt-1">
                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Laki-laki</label>
                            <input 
                              type="text" 
                              value={displayLaki}
                              disabled
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed" 
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Perempuan</label>
                            <input 
                              type="text" 
                              value={displayPerempuan}
                              disabled
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed" 
                            />
                          </div>
                          <div className="col-span-2 text-[11px] text-amber-600 font-bold mt-1 leading-tight">
                            *Angka total penduduk otomatis tersinkronisasi dengan data pada menu Grafik Penduduk.
                          </div>
                        </div>
                      )}
                    </div>
                  )})}
                </div>
              </div>
              
              <div className="flex justify-end gap-4 pt-6 sticky bottom-0 bg-white p-4 -mx-8 -mb-8 rounded-b-3xl">
                <button type="button" onClick={() => setShowEditor(false)} className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold transition-colors">
                  Batal
                </button>
                <button type="submit" className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center transition-all shadow-[0_8px_20px_rgba(5,150,105,0.3)] hover:shadow-[0_10px_25px_rgba(5,150,105,0.4)] hover:-translate-y-0.5">
                  <Save className="w-5 h-5 mr-2" /> Simpan Perubahan Beranda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editor Khusus Data Agenda */}
      {showEditorAgenda && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 border border-emerald-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-extrabold text-gray-900 flex items-center tracking-tight">
                <CalendarDays className="w-6 h-6 mr-2 text-emerald-600" /> 
                {editDataAgenda.id ? 'Edit Agenda' : 'Tambah Agenda Baru'}
              </h3>
              <button onClick={() => setShowEditorAgenda(false)} className="text-gray-400 hover:bg-gray-100 p-2 rounded-full transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveAgenda} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Nama Kegiatan</label>
                <input 
                  type="text" required
                  value={editDataAgenda.judul}
                  onChange={(e) => setEditDataAgenda({...editDataAgenda, judul: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Lokasi / Tempat</label>
                <input 
                  type="text" required
                  value={editDataAgenda.lokasi}
                  onChange={(e) => setEditDataAgenda({...editDataAgenda, lokasi: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Tanggal Pelaksanaan</label>
                <input 
                  type="date" required
                  value={editDataAgenda.tanggal}
                  onChange={(e) => setEditDataAgenda({...editDataAgenda, tanggal: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium" 
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowEditorAgenda(false)} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold transition">Batal</button>
                <button type="submit" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg transition-all hover:-translate-y-0.5 flex items-center">
                  <Save className="w-4 h-4 mr-2" /> Simpan Agenda
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
            Mengenal lebih dekat sejarah, visi misi, letak geografis, dan struktur organisasi Pemerintah Desa Upang Mulya.
          </p>
        </div>

        {isAdmin && (
          <div className="w-full max-w-5xl mb-6 flex justify-end">
            <button 
              onClick={() => openEditor()} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center transition-all"
            >
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
                  <button 
                    onClick={() => navigateTo('beranda')}
                    className="flex items-center text-sm md:text-base font-bold text-gray-500 hover:text-emerald-700 bg-gray-50 hover:bg-emerald-50 px-6 py-3.5 rounded-xl border border-gray-200 hover:border-emerald-200 transition-all shadow-sm hover:shadow-md"
                  >
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
                  <input 
                    type="text" required
                    value={editData.judul}
                    onChange={(e) => setEditData({...editData, judul: e.target.value})}
                    placeholder="Contoh: Sejarah Desa"
                    className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Pilih Ikon</label>
                  <div className="relative">
                    <select 
                      required
                      value={editData.iconName}
                      onChange={(e) => setEditData({...editData, iconName: e.target.value})}
                      className="w-full px-5 py-3 pl-12 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium appearance-none"
                    >
                      <option value="BookOpen">Buku (Sejarah/Cerita)</option>
                      <option value="Target">Target (Visi/Misi)</option>
                      <option value="Map">Peta (Geografis/Lokasi)</option>
                      <option value="Building2">Gedung (Struktur/Organisasi)</option>
                      <option value="Info">Info (Umum)</option>
                    </select>
                    <div className="absolute left-4 top-3.5 text-emerald-600 pointer-events-none">
                      {renderIcon(editData.iconName, "w-5 h-5")}
                    </div>
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
                  <textarea 
                    required rows={10}
                    value={editData.konten}
                    onChange={(e) => setEditData({...editData, konten: e.target.value})}
                    placeholder="Ketikkan isi informasi di sini secara menarik dan meyakinkan..."
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium leading-relaxed" 
                  ></textarea>
                </div>
              </div>
              
              <div className="flex justify-end gap-4 pt-6 sticky bottom-0 bg-white p-4 -mx-8 -mb-8 rounded-b-3xl">
                <button type="button" onClick={() => setShowEditor(false)} className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold transition-colors">
                  Batal
                </button>
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

// ============== HALAMAN PEMERINTAHAN (STRUKTUR SOTK PERSIS GAMBAR) ==============
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
      default: return 'Struktur Organisasi (SOTK)';
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

  const handleDeletePerangkat = (id: any) => {
    showConfirm('Yakin ingin menghapus perangkat desa ini?', () => {
      setDaftarPerangkat(daftarPerangkat.filter((p: any) => p.id !== id));
    });
  };
  const openEditorPerangkat = (perangkat: any = null) => {
    if (perangkat) setEditDataPerangkat(perangkat);
    else setEditDataPerangkat({ id: null, nama: '', jabatan: '', foto: '' });
    setShowEditorPerangkat(true);
  };
  const handleSavePerangkat = (e: any) => {
    e.preventDefault();
    if (editDataPerangkat.id) {
      setDaftarPerangkat(daftarPerangkat.map((p: any) => p.id === editDataPerangkat.id ? editDataPerangkat : p));
    } else {
      setDaftarPerangkat([...daftarPerangkat, { ...editDataPerangkat, id: Date.now() }]);
    }
    setShowEditorPerangkat(false);
  };
  const handleImageUploadPerangkat = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      compressImage(file, 300, false, (base64: any) => {
        setEditDataPerangkat({ ...editDataPerangkat, foto: base64 });
      });
      e.target.value = '';
    }
  };

  const filteredLembaga = daftarLembaga.filter((l: any) => l.kategori === activeTab);
  
  const handleDeleteLembaga = (id: any) => {
    showConfirm('Yakin ingin menghapus data ini?', () => {
      setDaftarLembaga(daftarLembaga.filter((l: any) => l.id !== id));
    });
  };
  const openEditorLembaga = (lembaga: any = null) => {
    if (lembaga) setEditDataLembaga(lembaga);
    else setEditDataLembaga({ id: null, kategori: activeTab, nama: '', jabatan: '', jenisKelamin: 'Laki-laki', umur: '', foto: '' });
    setShowEditorLembaga(true);
  };
  const handleSaveLembaga = (e: any) => {
    e.preventDefault();
    if (editDataLembaga.id) {
      setDaftarLembaga(daftarLembaga.map((l: any) => l.id === editDataLembaga.id ? editDataLembaga : l));
    } else {
      setDaftarLembaga([...daftarLembaga, { ...editDataLembaga, id: Date.now() }]);
    }
    setShowEditorLembaga(false);
  };
  const handleImageUploadLembaga = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      compressImage(file, 200, false, (base64: any) => {
        setEditDataLembaga({ ...editDataLembaga, foto: base64 });
      });
      e.target.value = '';
    }
  };

  // ----- PEMISAHAN KATEGORI UNTUK BAGAN STRUKTUR -----
  const kadesList = daftarPerangkat.filter((p: any) => p.jabatan.toUpperCase().includes('KEPALA DESA') || p.jabatan.toUpperCase() === 'KADES');
  const sekdesList = daftarPerangkat.filter((p: any) => p.jabatan.toUpperCase().includes('SEKRETARIS'));
  const kasiList = daftarPerangkat.filter((p: any) => p.jabatan.toUpperCase().includes('KASI'));
  const kaurList = daftarPerangkat.filter((p: any) => p.jabatan.toUpperCase().includes('KAUR'));
  const kasunList = daftarPerangkat.filter((p: any) => p.jabatan.toUpperCase().includes('KASUN') || p.jabatan.toUpperCase().includes('DUSUN'));

  // Desain Card Perangkat Persis Screenshot
  const PerangkatCard = ({ p }: any) => (
    <div style={{ width: '160px', height: '260px' }} className="bg-white border-[3px] border-black overflow-hidden relative flex flex-col items-center shadow-lg group z-10">
       {isAdmin && (
         <div className="absolute top-1 right-1 z-20 flex gap-1 bg-white/90 p-1 rounded backdrop-blur border border-black">
           <button onClick={() => openEditorPerangkat(p)} className="text-amber-600 hover:text-amber-800 p-1"><Edit className="w-3.5 h-3.5" /></button>
           <button onClick={() => handleDeletePerangkat(p.id)} className="text-rose-600 hover:text-rose-800 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
         </div>
       )}
       
       <div style={{ height: '180px' }} className="w-full bg-red-600 border-b-[3px] border-black flex-shrink-0">
          <img 
            src={p.foto} 
            alt={p.nama} 
            className="w-full h-full object-cover"
            onError={(e: any) => {
              if (e.target.src !== 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=400&q=80') {
                e.target.src = 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=400&q=80';
              }
            }} 
          />
       </div>
       <div className="p-2 text-center w-full bg-white flex-grow flex flex-col items-center justify-center">
          <h3 className="text-[12px] font-black text-black leading-tight mb-1 underline uppercase text-center line-clamp-2">{p.nama}</h3>
          <span className="text-[10px] font-bold text-black uppercase text-center leading-tight line-clamp-2">{p.jabatan}</span>
       </div>
    </div>
  );

  return (
    <div className="animate-in fade-in zoom-in-95 duration-500 py-16 bg-gray-50 min-h-[70vh]">
      <div className="container mx-auto px-4 lg:px-8 relative">
        
        <div className="text-center mb-16">
          <span className="text-emerald-600 font-bold tracking-widest uppercase text-sm mb-2 block">
            Pemerintahan Desa
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
            {getTabTitle(activeTab)}
          </h2>
          <div className="w-24 h-1.5 bg-gradient-to-r from-emerald-600 to-emerald-400 mx-auto rounded-full"></div>
          <p className="mt-6 text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed">
            {getTabSubtitle(activeTab)}
          </p>
        </div>

        {/* =========== TAMPILAN PERANGKAT DESA (HIERARKI BAGAN ABSOLUTE) =========== */}
        {isPerangkat && (
          <div className="animate-in fade-in duration-500 max-w-full">
            {isAdmin && (
              <div className="mb-10 flex justify-end bg-emerald-50 p-4 rounded-2xl border border-emerald-100 shadow-sm max-w-6xl mx-auto">
                <button 
                  onClick={() => openEditorPerangkat()} 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 px-8 rounded-xl shadow-[0_8px_20px_rgba(5,150,105,0.3)] hover:shadow-[0_10px_25px_rgba(5,150,105,0.4)] hover:-translate-y-0.5 flex items-center transition-all"
                >
                  <Plus className="w-5 h-5 mr-2" /> Tambah Perangkat
                </button>
              </div>
            )}

            {daftarPerangkat.length === 0 ? (
               <div className="col-span-full text-center text-gray-500 py-20 bg-white rounded-3xl border border-dashed border-gray-300 font-medium text-lg max-w-6xl mx-auto">Belum ada data perangkat desa.</div>
            ) : (
              <div className="w-full overflow-x-auto pb-10 custom-scrollbar">
                {/* Wadah Absolut untuk struktur berjenjang yang presisi */}
                <div style={{ width: '1300px', height: '1300px', position: 'relative', margin: '0 auto', marginTop: '40px' }} className="bg-white/50 rounded-3xl">

                  {/* --- GARIS PENGHUBUNG (CONNECTOR LINES) --- */}
                  
                  {/* Garis BPD ke Kades */}
                  <div style={{ position: 'absolute', left: '330px', top: '120px', width: '240px', borderTop: '4px dashed black', zIndex: 0 }}></div>
                  
                  {/* Batang Utama (Trunk) vertikal dari Kades turun ke Kasun */}
                  <div style={{ position: 'absolute', left: '648px', top: '260px', width: '4px', height: '680px', backgroundColor: 'black', zIndex: 0 }}></div>

                  {/* Cabang Sekdes (Kanan) */}
                  <div style={{ position: 'absolute', left: '648px', top: '300px', width: '304px', height: '4px', backgroundColor: 'black', zIndex: 0 }}></div>
                  <div style={{ position: 'absolute', left: '948px', top: '300px', width: '4px', height: '20px', backgroundColor: 'black', zIndex: 0 }}></div>
                  
                  {/* Sambungan bawah Sekdes menuju Kaur */}
                  <div style={{ position: 'absolute', left: '948px', top: '580px', width: '4px', height: '40px', backgroundColor: 'black', zIndex: 0 }}></div>

                  {/* Garis Horizontal Kaur */}
                  <div style={{ position: 'absolute', left: '748px', top: '620px', width: '404px', height: '4px', backgroundColor: 'black', zIndex: 0 }}></div>
                  {/* Drop Kaur 1, 2, 3 */}
                  <div style={{ position: 'absolute', left: '748px', top: '620px', width: '4px', height: '20px', backgroundColor: 'black', zIndex: 0 }}></div>
                  <div style={{ position: 'absolute', left: '948px', top: '620px', width: '4px', height: '20px', backgroundColor: 'black', zIndex: 0 }}></div>
                  <div style={{ position: 'absolute', left: '1148px', top: '620px', width: '4px', height: '20px', backgroundColor: 'black', zIndex: 0 }}></div>

                  {/* Cabang Kasi (Kiri) */}
                  <div style={{ position: 'absolute', left: '148px', top: '420px', width: '504px', height: '4px', backgroundColor: 'black', zIndex: 0 }}></div>
                  {/* Drop Kasi 1, 2, 3 */}
                  <div style={{ position: 'absolute', left: '148px', top: '420px', width: '4px', height: '40px', backgroundColor: 'black', zIndex: 0 }}></div>
                  <div style={{ position: 'absolute', left: '348px', top: '420px', width: '4px', height: '40px', backgroundColor: 'black', zIndex: 0 }}></div>
                  <div style={{ position: 'absolute', left: '548px', top: '420px', width: '4px', height: '40px', backgroundColor: 'black', zIndex: 0 }}></div>

                  {/* Cabang Kasun (Paling Bawah) */}
                  <div style={{ position: 'absolute', left: '348px', top: '940px', width: '604px', height: '4px', backgroundColor: 'black', zIndex: 0 }}></div>
                  {/* Drop Kasun 1, 2, 3 */}
                  <div style={{ position: 'absolute', left: '348px', top: '940px', width: '4px', height: '40px', backgroundColor: 'black', zIndex: 0 }}></div>
                  <div style={{ position: 'absolute', left: '648px', top: '940px', width: '4px', height: '40px', backgroundColor: 'black', zIndex: 0 }}></div>
                  <div style={{ position: 'absolute', left: '948px', top: '940px', width: '4px', height: '40px', backgroundColor: 'black', zIndex: 0 }}></div>


                  {/* --- KARTU PERANGKAT DESA (NODES) --- */}
                  
                  {/* Kotak BPD (Statis) */}
                  <div style={{ position: 'absolute', left: '170px', top: '80px', width: '160px', height: '80px', zIndex: 10 }} className="bg-white border-[3px] border-black flex items-center justify-center font-black text-2xl shadow-lg tracking-widest">
                    BPD
                  </div>

                  {/* Level 1: Kepala Desa */}
                  <div style={{ position: 'absolute', left: '570px', top: '0px', zIndex: 10 }}>
                    {kadesList[0] && <PerangkatCard p={kadesList[0]} />}
                  </div>

                  {/* Level 2: Sekretaris Desa */}
                  <div style={{ position: 'absolute', left: '870px', top: '320px', zIndex: 10 }}>
                    {sekdesList[0] && <PerangkatCard p={sekdesList[0]} />}
                  </div>

                  {/* Level 3: Kasi (Kiri) */}
                  <div style={{ position: 'absolute', left: '70px', top: '460px', zIndex: 10 }}>
                    {kasiList[0] && <PerangkatCard p={kasiList[0]} />}
                  </div>
                  <div style={{ position: 'absolute', left: '270px', top: '460px', zIndex: 10 }}>
                    {kasiList[1] && <PerangkatCard p={kasiList[1]} />}
                  </div>
                  <div style={{ position: 'absolute', left: '470px', top: '460px', zIndex: 10 }}>
                    {kasiList[2] && <PerangkatCard p={kasiList[2]} />}
                  </div>

                  {/* Level 3: Kaur (Kanan) */}
                  <div style={{ position: 'absolute', left: '670px', top: '640px', zIndex: 10 }}>
                    {kaurList[0] && <PerangkatCard p={kaurList[0]} />}
                  </div>
                  <div style={{ position: 'absolute', left: '870px', top: '640px', zIndex: 10 }}>
                    {kaurList[1] && <PerangkatCard p={kaurList[1]} />}
                  </div>
                  <div style={{ position: 'absolute', left: '1070px', top: '640px', zIndex: 10 }}>
                    {kaurList[2] && <PerangkatCard p={kaurList[2]} />}
                  </div>

                  {/* Level 4: Kasun (Bawah Tengah) */}
                  <div style={{ position: 'absolute', left: '270px', top: '980px', zIndex: 10 }}>
                    {kasunList[0] && <PerangkatCard p={kasunList[0]} />}
                  </div>
                  <div style={{ position: 'absolute', left: '570px', top: '980px', zIndex: 10 }}>
                    {kasunList[1] && <PerangkatCard p={kasunList[1]} />}
                  </div>
                  <div style={{ position: 'absolute', left: '870px', top: '980px', zIndex: 10 }}>
                    {kasunList[2] && <PerangkatCard p={kasunList[2]} />}
                  </div>

                </div>
              </div>
            )}
          </div>
        )}

        {/* =========== TAMPILAN LEMBAGA/LAINNYA (TABEL) =========== */}
        {!isPerangkat && (
          <div className="animate-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
            {isAdmin && (
              <div className="mb-6 flex justify-end">
                <button 
                  onClick={() => openEditorLembaga()} 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center transition-all"
                >
                  <Plus className="w-5 h-5 mr-2" /> Tambah Data
                </button>
              </div>
            )}

            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
              {filteredLembaga.length === 0 ? (
                 <div className="text-center text-gray-500 py-16 bg-white font-medium text-lg">Belum ada data tersedia.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left whitespace-nowrap">
                    <thead>
                      <tr className="bg-emerald-50 text-emerald-800 text-sm tracking-wide uppercase border-b-2 border-emerald-100">
                        <th className="px-6 py-5 font-bold">No</th>
                        <th className="px-6 py-5 font-bold">Foto</th>
                        <th className="px-6 py-5 font-bold">Nama Lengkap</th>
                        <th className="px-6 py-5 font-bold">Jabatan</th>
                        <th className="px-6 py-5 font-bold">Jenis Kelamin</th>
                        <th className="px-6 py-5 font-bold">Umur</th>
                        {isAdmin && <th className="px-6 py-5 font-bold text-center">Aksi</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredLembaga.map((item: any, index: number) => (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-bold text-gray-500">{index + 1}</td>
                          <td className="px-6 py-4">
                            <img 
                              src={item.foto || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=150&q=80'} 
                              alt={item.nama} 
                              className="w-14 h-14 rounded-xl object-cover shadow-sm border border-gray-200 bg-white"
                              onError={(e: any) => { 
                                if (e.target.src !== 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=150&q=80') {
                                  e.target.src = 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=150&q=80';
                                }
                              }}
                            />
                          </td>
                          <td className="px-6 py-4 font-extrabold text-gray-900 text-base">{item.nama}</td>
                          <td className="px-6 py-4 text-emerald-700 font-bold bg-emerald-50/50 rounded-lg inline-block mt-3.5 mb-1.5 ml-4 px-3 py-1 border border-emerald-100/50">{item.jabatan}</td>
                          <td className="px-6 py-4 font-medium text-gray-700">{item.jenisKelamin}</td>
                          <td className="px-6 py-4 font-medium text-gray-700">{item.umur} Thn</td>
                          {isAdmin && (
                            <td className="px-6 py-4">
                              <div className="flex justify-center gap-2">
                                <button onClick={() => openEditorLembaga(item)} className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition" title="Edit">
                                  <Edit className="w-5 h-5" />
                                </button>
                                <button onClick={() => handleDeleteLembaga(item.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition" title="Hapus">
                                  <Trash2 className="w-5 h-5" />
                                </button>
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

      {showEditorPerangkat && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-8 max-h-[90vh] overflow-y-auto border border-emerald-100 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100">
              <h3 className="text-2xl font-extrabold text-gray-900 flex items-center">
                <div className="bg-emerald-100 p-2 rounded-xl mr-3">
                   <Users className="w-6 h-6 text-emerald-600" />
                </div>
                {editDataPerangkat.id ? 'Edit Perangkat' : 'Tambah Perangkat Baru'}
              </h3>
              <button type="button" onClick={() => setShowEditorPerangkat(false)} className="text-gray-400 hover:text-gray-600 bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSavePerangkat} className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Nama Lengkap</label>
                  <input 
                    type="text" required
                    value={editDataPerangkat.nama}
                    onChange={(e) => setEditDataPerangkat({...editDataPerangkat, nama: e.target.value})}
                    placeholder="Contoh: Bapak Fulan, S.E."
                    className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Jabatan (Berpengaruh pada urutan bagan)</label>
                  <input 
                    type="text" required
                    value={editDataPerangkat.jabatan}
                    onChange={(e) => setEditDataPerangkat({...editDataPerangkat, jabatan: e.target.value})}
                    placeholder="Ketik 'Kepala Desa' untuk posisi atas"
                    className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium" 
                  />
                  <p className="text-xs text-gray-500 mt-2 font-medium">*Sistem membaca teks KEPALA DESA, SEKRETARIS, KASI, KAUR, dan KASUN untuk diletakkan ke posisinya masing-masing.</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">Foto Profil</label>
                  <div className="flex items-center gap-5 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                    {editDataPerangkat.foto ? (
                      <img src={editDataPerangkat.foto} alt="Preview" className="w-24 h-24 object-cover rounded-xl shadow-sm border border-gray-200" />
                    ) : (
                      <div className="w-24 h-24 bg-gray-200 rounded-xl flex items-center justify-center border border-gray-300 border-dashed">
                        <ImageIcon className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <label className="cursor-pointer bg-white text-emerald-700 border-2 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 px-5 py-3 rounded-xl font-bold flex items-center justify-center transition-all shadow-sm">
                        <Upload className="w-5 h-5 mr-2" /> Upload Foto Baru
                        <input type="file" accept="image/*" required={!editDataPerangkat.foto} className="hidden" onChange={handleImageUploadPerangkat} />
                      </label>
                      <p className="text-sm text-gray-500 mt-3 font-medium">Otomatis dikecilkan agar memori aman.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-4 pt-6 sticky bottom-0 bg-white p-4 -mx-8 -mb-8 rounded-b-3xl">
                <button type="button" onClick={() => setShowEditorPerangkat(false)} className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold transition-colors">
                  Batal
                </button>
                <button type="submit" className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center transition-all shadow-[0_8px_20px_rgba(5,150,105,0.3)] hover:shadow-[0_10px_25px_rgba(5,150,105,0.4)] hover:-translate-y-0.5">
                  <Save className="w-5 h-5 mr-2" /> Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditorLembaga && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto border border-emerald-100 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100">
              <h3 className="text-2xl font-extrabold text-gray-900 flex items-center">
                <div className="bg-emerald-100 p-2 rounded-xl mr-3">
                   <Users className="w-6 h-6 text-emerald-600" />
                </div>
                {editDataLembaga.id ? 'Edit Data' : 'Tambah Data Baru'}
              </h3>
              <button type="button" onClick={() => setShowEditorLembaga(false)} className="text-gray-400 hover:text-gray-600 bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveLembaga} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-full">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Nama Lengkap</label>
                  <input 
                    type="text" required
                    value={editDataLembaga.nama}
                    onChange={(e) => setEditDataLembaga({...editDataLembaga, nama: e.target.value})}
                    placeholder="Masukkan nama lengkap"
                    className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Jabatan</label>
                  <input 
                    type="text" required
                    value={editDataLembaga.jabatan}
                    onChange={(e) => setEditDataLembaga({...editDataLembaga, jabatan: e.target.value})}
                    placeholder="Contoh: Ketua RT 01"
                    className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Jenis Kelamin</label>
                  <div className="relative">
                    <select 
                      required
                      value={editDataLembaga.jenisKelamin}
                      onChange={(e) => setEditDataLembaga({...editDataLembaga, jenisKelamin: e.target.value})}
                      className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium appearance-none"
                    >
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Umur (Tahun)</label>
                  <input 
                    type="number" required min="18" max="90"
                    value={editDataLembaga.umur}
                    onChange={(e) => setEditDataLembaga({...editDataLembaga, umur: e.target.value})}
                    placeholder="Contoh: 45"
                    className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium" 
                  />
                </div>

                <div className="col-span-full">
                  <label className="block text-sm font-bold text-gray-700 mb-3">Foto Profil</label>
                  <div className="flex items-center gap-5 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                    {editDataLembaga.foto ? (
                      <img src={editDataLembaga.foto} alt="Preview" className="w-24 h-24 object-cover rounded-xl shadow-sm border border-gray-200" />
                    ) : (
                      <div className="w-24 h-24 bg-gray-200 rounded-xl flex items-center justify-center border border-gray-300 border-dashed">
                        <ImageIcon className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <label className="cursor-pointer bg-white text-emerald-700 border-2 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 px-5 py-3 rounded-xl font-bold flex items-center justify-center transition-all shadow-sm w-max">
                        <Upload className="w-5 h-5 mr-2" /> Upload Foto Baru
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUploadLembaga} />
                      </label>
                      <p className="text-sm text-gray-500 mt-2 font-medium">Opsional. Otomatis dikecilkan agar aman.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-4 pt-6 sticky bottom-0 bg-white p-4 -mx-8 -mb-8 rounded-b-3xl">
                <button type="button" onClick={() => setShowEditorLembaga(false)} className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold transition-colors">
                  Batal
                </button>
                <button type="submit" className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center transition-all shadow-[0_8px_20px_rgba(5,150,105,0.3)] hover:shadow-[0_10px_25px_rgba(5,150,105,0.4)] hover:-translate-y-0.5">
                  <Save className="w-5 h-5 mr-2" /> Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function HalamanBerita({ isAdmin, activeTab, daftarBerita, setDaftarBerita, dataGrafik, setGrafik, showConfirm }: any) {
  const [showEditorBerita, setShowEditorBerita] = useState(false);
  const [editDataBerita, setEditDataBerita] = useState<any>(null);
  const [selectedBerita, setSelectedBerita] = useState<any>(null);

  const [showEditorGrafik, setShowEditorGrafik] = useState(false);
  const [editDataGrafik, setEditDataGrafik] = useState<any>(dataGrafik);

  const isListBerita = activeTab === 'list-berita' || !activeTab;

  const handleDelete = (id: any) => {
    showConfirm('Yakin ingin menghapus berita ini?', () => {
      setDaftarBerita(daftarBerita.filter((b: any) => b.id !== id));
    });
  };

  const openEditorBerita = (berita: any = null) => {
    if (berita) {
      setEditDataBerita(berita);
    } else {
      setEditDataBerita({ id: null, judul: '', tanggal: '', kategori: '', excerpt: '', gambar: '' });
    }
    setShowEditorBerita(true);
  };

  const handleSaveBerita = (e: any) => {
    e.preventDefault();
    if (editDataBerita.id) {
      setDaftarBerita(daftarBerita.map((b: any) => b.id === editDataBerita.id ? editDataBerita : b));
      if (selectedBerita && selectedBerita.id === editDataBerita.id) {
        setSelectedBerita(editDataBerita);
      }
    } else {
      const newBerita = { ...editDataBerita, id: Date.now() };
      setDaftarBerita([newBerita, ...daftarBerita]);
    }
    setShowEditorBerita(false);
  };

  const handleSaveGrafik = (e: any) => {
    e.preventDefault();
    setGrafik({
      ...editDataGrafik,
      lakiLaki: parseInt(editDataGrafik.lakiLaki) || 0,
      perempuan: parseInt(editDataGrafik.perempuan) || 0
    });
    setShowEditorGrafik(false);
  };

  const handleImageUpload = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      compressImage(file, 500, false, (base64: any) => {
        setEditDataBerita({ ...editDataBerita, gambar: base64 });
      });
      e.target.value = '';
    }
  };

  const totalPenduduk = (dataGrafik.lakiLaki || 0) + (dataGrafik.perempuan || 0);
  const persentaseLaki = totalPenduduk > 0 ? Math.round((dataGrafik.lakiLaki / totalPenduduk) * 100) : 0;
  const persentasePerempuan = totalPenduduk > 0 ? Math.round((dataGrafik.perempuan / totalPenduduk) * 100) : 0;

  return (
    <div className="animate-in fade-in zoom-in-95 duration-500 py-16 bg-gray-50 min-h-[70vh]">
      <div className="container mx-auto px-4 lg:px-8 relative">
        
        {isListBerita ? (
          <>
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
                  <div className="mb-10 flex justify-end bg-emerald-50 p-4 rounded-2xl border border-emerald-100 shadow-sm max-w-6xl mx-auto">
                    <button 
                      onClick={() => openEditorBerita()} 
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 px-8 rounded-xl shadow-[0_8px_20px_rgba(5,150,105,0.3)] hover:shadow-[0_10px_25px_rgba(5,150,105,0.4)] hover:-translate-y-0.5 flex items-center transition-all"
                    >
                      <Plus className="w-5 h-5 mr-2" /> Tulis Berita Baru
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 max-w-6xl mx-auto">
                  {daftarBerita.length === 0 && (
                     <div className="col-span-full text-center text-gray-500 py-20 bg-white rounded-3xl border border-dashed border-gray-300 font-medium text-lg">Belum ada berita yang diterbitkan.</div>
                  )}

                  {daftarBerita.map((berita: any) => (
                    <div key={berita.id} className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col relative border border-gray-100 group overflow-hidden">
                      {isAdmin && (
                        <div className="absolute top-4 right-4 z-20 flex gap-2">
                          <button onClick={() => openEditorBerita(berita)} className="bg-amber-500 hover:bg-amber-600 text-white p-2.5 rounded-xl shadow-lg transition">
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
          </>
        ) : (
          /* TAMPILAN GRAFIK PENDUDUK */
          <div className="animate-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <span className="text-emerald-600 font-bold tracking-widest uppercase text-sm mb-2 block">Visualisasi Data</span>
              <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">Demografi Penduduk</h2>
              <div className="w-24 h-1.5 bg-gradient-to-r from-emerald-600 to-emerald-400 mx-auto rounded-full"></div>
              <p className="mt-6 text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed">
                Persentase perbandingan jumlah penduduk Laki-laki dan Perempuan di Desa Upang Mulya berdasarkan pembaruan data terakhir.
              </p>
            </div>

            {isAdmin && (
              <div className="mb-10 flex justify-end bg-emerald-50 p-4 rounded-2xl border border-emerald-100 shadow-sm max-w-4xl mx-auto">
                <button 
                  onClick={() => { setEditDataGrafik(dataGrafik); setShowEditorGrafik(true); }} 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 px-8 rounded-xl shadow-[0_8px_20px_rgba(5,150,105,0.3)] hover:shadow-[0_10px_25px_rgba(5,150,105,0.4)] hover:-translate-y-0.5 flex items-center transition-all"
                >
                  <Edit className="w-5 h-5 mr-2" /> Edit Angka Grafik
                </button>
              </div>
            )}

            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 md:p-14 relative overflow-hidden max-w-4xl mx-auto flex flex-col md:flex-row gap-12 items-center justify-center">
              <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-50 rounded-br-full -z-10 opacity-70"></div>
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-amber-50 rounded-tl-full -z-10 opacity-70"></div>

              {/* Left Side: Summary Big Number */}
              <div className="w-full md:w-1/3 text-center md:text-left z-10">
                <h3 className="text-xl font-bold text-gray-500 mb-2 uppercase tracking-widest flex justify-center md:justify-start items-center">
                  <TrendingUp className="w-5 h-5 mr-2" /> Total Populasi
                </h3>
                <div className="text-6xl md:text-7xl font-black text-gray-900 mb-2 drop-shadow-md">
                  {totalPenduduk.toLocaleString('id-ID')}
                </div>
                <div className="inline-block bg-emerald-100 text-emerald-800 px-4 py-1.5 rounded-full font-bold text-sm tracking-wide border border-emerald-200">
                  Tahun {dataGrafik.tahun}
                </div>
                <p className="text-sm text-gray-400 mt-6 font-medium">Diperbarui: {dataGrafik.updateTerakhir}</p>
              </div>

              {/* Right Side: Awesome Custom CSS Bar Chart */}
              <div className="w-full md:w-2/3 z-10">
                
                {/* Laki-Laki Bar */}
                <div className="mb-8">
                  <div className="flex justify-between items-end mb-3">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex justify-center items-center mr-4 shadow-inner">
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                           <path d="M10 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z"></path><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-2xl font-extrabold text-gray-900 tracking-tight">Laki-laki</h4>
                        <span className="text-blue-600 font-bold text-sm bg-blue-50 px-2 py-0.5 rounded-md mt-1 inline-block border border-blue-100">{persentaseLaki}%</span>
                      </div>
                    </div>
                    <div className="text-3xl font-black text-gray-800">{dataGrafik.lakiLaki.toLocaleString('id-ID')}</div>
                  </div>
                  
                  <div className="w-full bg-gray-100 h-6 rounded-full overflow-hidden shadow-inner border border-gray-200">
                    <div 
                      className="bg-gradient-to-r from-blue-400 to-blue-600 h-full rounded-full animate-grow relative"
                      style={{ width: `${persentaseLaki}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 w-full h-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)', transform: 'skewX(-20deg)', animation: 'slideRight 2s infinite linear' }}></div>
                    </div>
                  </div>
                </div>

                {/* Perempuan Bar */}
                <div>
                  <div className="flex justify-between items-end mb-3">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-rose-100 text-rose-500 rounded-2xl flex justify-center items-center mr-4 shadow-inner">
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                           <path d="M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z"></path><path d="M12 13v8"></path><path d="M9 18h6"></path>
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-2xl font-extrabold text-gray-900 tracking-tight">Perempuan</h4>
                        <span className="text-rose-500 font-bold text-sm bg-rose-50 px-2 py-0.5 rounded-md mt-1 inline-block border border-rose-100">{persentasePerempuan}%</span>
                      </div>
                    </div>
                    <div className="text-3xl font-black text-gray-800">{dataGrafik.perempuan.toLocaleString('id-ID')}</div>
                  </div>
                  
                  <div className="w-full bg-gray-100 h-6 rounded-full overflow-hidden shadow-inner border border-gray-200">
                    <div 
                      className="bg-gradient-to-r from-rose-400 to-rose-500 h-full rounded-full animate-grow relative"
                      style={{ width: `${persentasePerempuan}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 w-full h-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)', transform: 'skewX(-20deg)', animation: 'slideRight 2s infinite linear' }}></div>
                    </div>
                  </div>
                </div>
                
                <style>{`
                  @keyframes slideRight {
                    0% { left: -100%; }
                    100% { left: 100%; }
                  }
                `}</style>
              </div>
            </div>
          </div>
        )}

      </div>

      {showEditorBerita && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto border border-emerald-100 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100">
              <h3 className="text-2xl font-extrabold text-gray-900 flex items-center">
                <div className="bg-emerald-100 p-2 rounded-xl mr-3">
                   <Newspaper className="w-6 h-6 text-emerald-600" />
                </div>
                {editDataBerita.id ? 'Edit Berita' : 'Tambah Berita Baru'}
              </h3>
              <button type="button" onClick={() => setShowEditorBerita(false)} className="text-gray-400 hover:text-gray-600 bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveBerita} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-full">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Judul Berita</label>
                  <input 
                    type="text" required
                    value={editDataBerita.judul}
                    onChange={(e) => setEditDataBerita({...editDataBerita, judul: e.target.value})}
                    className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Kategori</label>
                  <select 
                    required
                    value={editDataBerita.kategori}
                    onChange={(e) => setEditDataBerita({...editDataBerita, kategori: e.target.value})}
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
                    value={editDataBerita.tanggal}
                    onChange={(e) => setEditDataBerita({...editDataBerita, tanggal: e.target.value})}
                    className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium" 
                  />
                </div>

                <div className="col-span-full">
                  <label className="block text-sm font-bold text-gray-700 mb-3">Gambar / Foto Berita</label>
                  <div className="flex items-center gap-5 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                    {editDataBerita.gambar ? (
                      <img src={editDataBerita.gambar} alt="Preview" className="w-32 h-32 object-cover rounded-xl shadow-sm border border-gray-200" />
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
                    value={editDataBerita.excerpt}
                    onChange={(e) => setEditDataBerita({...editDataBerita, excerpt: e.target.value})}
                    className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium leading-relaxed" 
                  ></textarea>
                </div>
              </div>
              
              <div className="flex justify-end gap-4 pt-6 sticky bottom-0 bg-white p-4 -mx-8 -mb-8 rounded-b-3xl">
                <button type="button" onClick={() => setShowEditorBerita(false)} className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold transition-colors">
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

      {/* Modal Editor Khusus Data Grafik */}
      {showEditorGrafik && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 animate-in zoom-in-95 border border-emerald-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-extrabold text-gray-900 flex items-center tracking-tight">
                <PieChart className="w-6 h-6 mr-2 text-emerald-600" /> Update Grafik
              </h3>
              <button onClick={() => setShowEditorGrafik(false)} className="text-gray-400 hover:bg-gray-100 p-2 rounded-full transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveGrafik} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Jumlah Laki-laki</label>
                <input 
                  type="number" required min="0"
                  value={editDataGrafik.lakiLaki}
                  onChange={(e) => setEditDataGrafik({...editDataGrafik, lakiLaki: e.target.value})}
                  className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Jumlah Perempuan</label>
                <input 
                  type="number" required min="0"
                  value={editDataGrafik.perempuan}
                  onChange={(e) => setEditDataGrafik({...editDataGrafik, perempuan: e.target.value})}
                  className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Tahun</label>
                    <input 
                      type="number" required
                      value={editDataGrafik.tahun}
                      onChange={(e) => setEditDataGrafik({...editDataGrafik, tahun: e.target.value})}
                      className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium" 
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Bulan (Teks)</label>
                    <input 
                      type="text" required placeholder="Juli 2024"
                      value={editDataGrafik.updateTerakhir}
                      onChange={(e) => setEditDataGrafik({...editDataGrafik, updateTerakhir: e.target.value})}
                      className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium" 
                    />
                 </div>
              </div>
              <button 
                type="submit" 
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg mt-4 transition-all hover:-translate-y-0.5"
              >
                Simpan Grafik
              </button>
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
