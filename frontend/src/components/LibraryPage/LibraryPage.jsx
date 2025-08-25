import Header from "../Header/Header";
import Footer from "../Footer/Footer";
import Aside from '../Aside/Aside';
import Card from '../Card/Card';
import styles from './LibraryPage.module.css';

function MainPage() {


  return (
    <div className={styles.container}>
      <Header />
      <div className={styles.body}>
        <Aside/>
        
        <main className={styles.main} >
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
