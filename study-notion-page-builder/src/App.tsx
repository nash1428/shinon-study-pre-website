import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, useParams, useNavigate } from "react-router-dom";
import { PageEditor } from "./pages/PageEditor";
import { usePage } from "./hooks/usePage";
import { exportPageAsMarkdown } from "./lib/markdownExport";

const EditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { blocks, loading, saving, error, loadPage, createNewPage, updateBlocks } = usePage(id);

  useEffect(() => {
    if (id) {
      loadPage(id);
    }
  }, [id, loadPage]);

  const handleCreate = async () => {
    const newId = await createNewPage();
    navigate(`/page/${newId}`);
  };

  const handleExport = () => {
    const md = exportPageAsMarkdown(blocks);
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "page.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-8 py-3">
          <h1 className="text-lg font-semibold text-gray-900">
            {id ? `Page ${id.slice(0, 8)}` : "New Page"}
          </h1>
          <div className="flex items-center gap-3">
            {saving && <span className="text-xs text-gray-400">Saving...</span>}
            {error && <span className="text-xs text-red-500">{error}</span>}
            <button
              className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              onClick={handleCreate}
            >
              New Page
            </button>
            <button
              className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              onClick={handleExport}
            >
              Export MD
            </button>
          </div>
        </div>
      </header>
      {loading ? (
        <div className="flex h-96 items-center justify-center text-gray-400">Loading...</div>
      ) : (
        <PageEditor blocks={blocks} onChange={(b) => updateBlocks(() => b)} />
      )}
    </div>
  );
};

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { createNewPage } = usePage();

  const handleCreate = async () => {
    const id = await createNewPage();
    navigate(`/page/${id}`);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-notion-bg">
      <div className="rounded-lg bg-white p-12 text-center shadow-notion">
        <h1 className="text-3xl font-bold text-gray-900">Study Notion Page Builder</h1>
        <p className="mt-4 text-gray-600">Create, edit, and organize your study pages.</p>
        <button
          className="mt-8 rounded bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
          onClick={handleCreate}
        >
          Create New Page
        </button>
      </div>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/page/:id" element={<EditorPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
