export const metadata = {
  title: "KennMusic",
  description: "Music player powered by Kenn",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body style={{ margin: 0, padding: 0, overflowX: "hidden" }}>{children}</body>
    </html>
  );
}
