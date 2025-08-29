import { useContext } from "react";
import { useSearchParams } from "react-router-dom";
import { FaLock, FaUnlock } from 'react-icons/fa';

import Styles from './OwnedGamesDetails.module.css'
import AuthContext from "../../contexts/AuthContext";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";

function OwnedGamesDetails() 
{
    const [searchParams] = useSearchParams();
    const platform = searchParams.get("platform");
    const id = searchParams.get("id");

    const {user} = useContext(AuthContext);
    const game = user.ownedGames?.[platform]?.[id];

    function renderAchievements()
    {
        return game.achievements.map((ach, index) => 
        {
            let formattedDate = "Achievement still locked";

            if (ach.unlocked && ach.dateUnlocked) 
            {
                const date = new Date(ach.dateUnlocked);
                if (!isNaN(date.getTime())) 
                {
                    formattedDate = `Unlocked on ${date.toLocaleString("en-GB", 
                    {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                    })}`;
                }
            }

            return (
                <div className={Styles.achBar} key={index} style={{background: ach.unlocked ? "#0c3718" : "#4f0f0d"}}>
                    <div className={Styles.achIcon}>
                        {ach.unlocked ? <FaUnlock color="#00ff80" /> : <FaLock color="#ff4c4c" />}
                    </div>
                    <div className={Styles.achText}>
                        <h2>{ach.title}</h2>
                        <p>{ach.description}</p>
                        <p className="date">{formattedDate}</p>
                    </div>
                </div>
            );
        });
    }

    return (
        <div className={Styles.container}>
            <Header />
            <div className={Styles.page}>
                <div className={Styles.top}>
                    <div className={Styles.info}>
                        <h1 className={Styles.gameTitle}>{game.gameName} Details</h1>
                        <div className={Styles.link}>
                            <label >Open Game at Steam Desktop App: </label>
                            <a className={Styles.storeLink} onClick={()=> window.location.href = ` steam://store/${id}`}>Steam Link</a>
                        </div>
                        <div className={Styles.link}>
                            <label>Open Game at Steam WebSite: </label>
                            <a className={Styles.storeLink} onClick={()=> window.location.href = ` steam://store/${id}`}>Steam WebSite</a>
                        </div>
                        <p className={Styles.platform}>You bought the game on: {platform}</p>
                    </div>
                    <img src={game.coverImage} alt={game.gameName} />
                </div>
                <div className={Styles.achContainer}>
                    {renderAchievements()}
                </div>
            </div>
            <Footer />
        </div>
    );
}

export default OwnedGamesDetails;
