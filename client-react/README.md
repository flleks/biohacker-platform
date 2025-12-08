# Biohacker Platform – React (Vite)

## Uruchomienie

1. Backend musi działać na `http://localhost:4000` (sprawdź `/health`).
2. Wejdź do katalogu frontu:
```bash
cd /Users/kacperczyk/Desktop/biohacker-platform/client-react
```
3. Zainstaluj zależności i odpal dev server:
```bash
npm install
npm run dev
```
4. Otwórz adres z konsoli (np. `http://localhost:5173`).
5. (Opcjonalnie) stwórz plik `.env` i ustaw:
```bash
VITE_API_BASE=http://localhost:4000
```

## Funkcje
- Rejestracja/logowanie, token w localStorage.
- Lista postów, tworzenie, like/unlike, usuwanie własnych.
- Komentarze: dodawanie i listowanie dla wybranego posta.


