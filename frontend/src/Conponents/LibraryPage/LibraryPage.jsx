import { useState } from 'react';
import Header from "../Header/Header.jsx";
import Footer from "../Footer/Footer.jsx";
import Aside from '../Aside/Aside.jsx';
import Card from '../Card/Card.jsx';
import styles from './LibraryPage.module.css';

function MainPage() {
  const [isAsideOpen, setIsAsideOpen] = useState(false);

  const handleMouseEnter = () => setIsAsideOpen(true);
  const handleMouseLeave = () => setIsAsideOpen(false);

  return (
    <div className={styles.container}>
      <Header />
      <div className={styles.body}>
        <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}><Aside isOpen={isAsideOpen} /></div>
        
        <main className={`${styles.main} ${!isAsideOpen && styles.fullWidth}`}>
          <div className={styles.cardGrid}>
            <Card title="Red Dead Redemtion 2" image="https://www.games2egypt.com/Images/Products/27649?fileFormat=1" description="" />
            <Card title="Sims 2" image="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSgU0fpNChuXN5MQlTBMWUx-6AD5SQaruvBlQ&s" description="" />
            <Card title="Card 3" image="" description="" />
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

export default MainPage;
