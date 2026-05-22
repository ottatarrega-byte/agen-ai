import os
import shutil
from crewai import Agent, Task, Crew, LLM
from crewai.tools import tool

print("=== Python Berhasil Menjalankan Script ===")

# 🔑 Ambil API key dari environment
api_key = os.environ.get("DEEPSEEK_API_KEY")

# 🧠 Inisialisasi Deepseek
llm = LLM(
    model="deepseek/deepseek-chat",
    base_url="https://api.deepseek.com",
    api_key=api_key
)

# 🛠️ Definisi Alat Eksekusi (Tool)
@tool("Alat Manajemen File Downloads")
def kelola_file_downloads(aksi: str) -> str:
    """Alat untuk memindai folder Downloads dan merapikan file berdasarkan kategori setelah mendapat izin."""
    path_downloads = os.path.expanduser("~/Downloads")
    
    # Kategori ekstensi sesuai kebutuhanmu
    kategori = {
        "PDF": [".pdf"],
        "Gambar": [".jpg", ".jpeg", ".png", ".gif", ".svg"],
        "Audio": [".mp3", ".wav", ".flac", ".m4a"],
        "Video": [".mp4", ".mkv", ".mov", ".avi"],
        "Dokumen": [".docx", ".xlsx", ".pptx", ".txt", ".csv"]
    }

    files = [f for f in os.listdir(path_downloads) if os.path.isfile(os.path.join(path_downloads, f))]
    
    if not files:
        return "Folder Downloads sudah rapi atau kosong."

    rencana = []
    tindakan = []

    # Membuat rencana pemindahan
    for file in files:
        nama_file, ekstensi = os.path.splitext(file)
        ekstensi = ekstensi.lower()
        
        target_folder = "Dokumen"
        for kat, ext_list in kategori.items():
            if ekstensi in ext_list:
                target_folder = kat
                break
                
        rencana.append(f"- {file} -> Folder {target_folder}")
        tindakan.append((file, target_folder))

    # Tampilkan rencana ke pengguna
    print("\n=== Rencana Merapikan Folder Downloads ===")
    print("\n".join(rencana))
    
    konfirmasi = input("\nApakah kamu mengizinkan pemindahan ini? (Y/N): ")
    
    if konfirmasi.lower() != 'y':
        return "Proses dibatalkan oleh pengguna. Tidak ada file yang dipindahkan."

    # Eksekusi jika diizinkan
    berhasil = 0
    for file, folder in tindakan:
        folder_tujuan = os.path.join(path_downloads, folder)
        os.makedirs(folder_tujuan, exist_ok=True)
        shutil.move(os.path.join(path_downloads, file), os.path.join(folder_tujuan, file))
        berhasil += 1

    return f"Sukses! {berhasil} file telah dirapikan ke folder masing-masing."

# 🤖 Definisi Agen
file_manager_agent = Agent(
    role="Macbook Expert",
    goal="Merapikan dan mengorganisasi file serta folder di macOS secara sistematis",
    backstory="Kamu adalah asisten sistem macOS yang sangat teliti, aman, dan ahli dalam manajemen penyimpanan serta struktur dokumen komputer.",
    llm=llm,
    tools=[kelola_file_downloads],
    allow_delegation=False
)

path_downloads = os.path.expanduser("~/Downloads")

# 📋 Definisi Tugas (Task)
organize_task = Task(
    description=f"Periksa seluruh file acak yang ada di folder {path_downloads}. "
                f"Panggil Alat Manajemen File Downloads untuk menunjukkan rencana pemindahan "
                f"dan eksekusi setelah mendapat izin.",
    expected_output="Laporan rapi berisi daftar file yang berhasil dipindahkan ke folder kategori barunya.",
    agent=file_manager_agent
)

# 👥 Menyatukan ke dalam Crew
mac_crew = Crew(
    agents=[file_manager_agent],
    tasks=[organize_task],
    verbose=True
)

# 🚀 Menjalankan CrewAI
if __name__ == "__main__":
    hasil = mac_crew.kickoff()
    print("\n=== Hasil Akhir Agen AI ===")
    print(hasil)