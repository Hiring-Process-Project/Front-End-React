import React, { useState } from "react";
import "./App.css";
import MyGridLayout from "./components/MyGridLayout";
import OrgStructureApp from "./components/OrgStructureApp";

function App() {
  const [page, setPage] = useState("org");

  return (
    <>
      {page === "org" ? (
        <OrgStructureApp onSwitchPage={() => setPage("grid")} />
      ) : (
        <MyGridLayout onSwitchPage={() => setPage("org")} />
      )}
    </>
  );
}

export default App;

