import React, { useState } from 'react';
import initSqlJs, { SqlJsStatic } from 'sql.js';
import { unzipSync } from 'fflate';

const AnkiExtractor: React.FC = () => {
  const [cards, setCards] = useState<any[]>([]);

  const loadSqlJs = async (): Promise<SqlJsStatic> => {
    const SQL = await initSqlJs({
      locateFile: (file) => `/sql-wasm.wasm`
    });
    return SQL;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const buffer = await file.arrayBuffer();
    
    // Unzip the .apkg file
    const unzipped: Record<string, Uint8Array> = unzipSync(new Uint8Array(buffer));
    console.log("unzipped",unzipped)
    
    // Find and read the collection.anki2 file
    const collectionFile = unzipped['collection.anki2'];
    console.log("collectionFile",collectionFile)
    if (!collectionFile) {
      console.error('collection.anki2 not found in the package');
      alert('collection.anki2 not found in the package')
      return;
    }
    const SQL = await loadSqlJs();
    const db = new SQL.Database(collectionFile);

    // Example query to get data from the cards table
    const result = db.exec("SELECT * FROM cards");

    if (result.length > 0) {
      const columns = result[0].columns;
      const values = result[0].values;
      const cardData = values.map(row => {
        let card: Record<string, any> = {};
        columns.forEach((col, index) => {
          card[col] = row[index];
        });
        return card;
      });
      setCards(cardData);
    }
  };

  return (
    <div>
      <input type="file" accept=".apkg" onChange={handleFileUpload} />
      <div>
        <h2>Extracted Cards</h2>
        {cards.length > 0 ? (
          <ul>
            {cards.map((card, index) => (
              <li key={index}>
                {JSON.stringify(card)}
              </li>
            ))}
          </ul>
        ) : (
          <p>No cards extracted.</p>
        )}
      </div>
    </div>
  );
};

export default AnkiExtractor;
