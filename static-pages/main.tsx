import React from 'react';
import {createRoot} from 'react-dom/client';
import LifeApp from '../app/life-app';
import '../app/globals.css';
import '../app/illustrated-journal.css';
import '../app/textile.css';

createRoot(document.getElementById('root')!).render(<React.StrictMode><LifeApp/></React.StrictMode>);
