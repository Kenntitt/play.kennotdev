export const metadata = {
  title: "KennMusic",
  description: "Music player powered by Spotify",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
