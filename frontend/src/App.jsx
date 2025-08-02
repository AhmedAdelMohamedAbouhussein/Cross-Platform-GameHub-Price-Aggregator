import Footer from "./Conponents/Footer.jsx";
import  Header from "./Conponents/Header.jsx" //when exporting default, dont use curly braces 
import LoginPage from "./Conponents/LoginPage.jsx";
import Card from "./Conponents/Card/Card.jsx";

function App() 
{
    return(
        <div className="cardContainer">
        <Card image="" title="game of games" description=""/>
        <Card image="https://www.pcgamesn.com/wp-content/sites/pcgamesn/2025/03/best-pc-games-1-550x309.jpg" title="Hello" description="one of the best game to be created ever one of the best game to be created eveone of the best game to be created eveone of the best game to be created eveone of the best game to be created eveone of the best game to be created eve" />
        <Card image="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQNbkECXtEG_6-RV7CSNgNoYUGZE-JCliYm9g&s" title="Hello" description="one of the best game to be created ever" />
        </div>
    );
}

export default App;
