import {useContext, useState } from 'react';
import { Link } from "react-router-dom";
import styles from './Aside.module.css';
import AuthContext from "../../contexts/AuthContext";  // <-- your auth provider
import { FaCaretLeft, FaSteam, FaXbox, FaGamepad, FaComments, FaUserFriends, FaCaretRight } from "react-icons/fa";
import { FaCaretDown, FaCaretUp, FaCog, FaSignOutAlt } from "react-icons/fa";
import { SiEpicgames, SiGogdotcom, SiNintendo, SiPlaystation  } from 'react-icons/si';


function Aside() {
  const { user } = useContext(AuthContext); // <-- access logged-in user
  const [isOpen, setIsOpen] = useState(true); // sidebar open/close state
  const [isAccountOpen, setIsAccountOpen] = useState(false); // <-- account dropdown state

  // toggle sidebar
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleSidebarClick = () => {
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const toggleAccount = () => 
  {
      setIsAccountOpen(!isAccountOpen);
  }

  return (
    <div className={`${styles.sidebar} ${!isOpen ? styles.hide : ''}`} onClick={handleSidebarClick} >
      <div className={styles.content}>
        <div className={styles.top}>
          <div className={styles.company}>
            <img src={user.profilePicture && user.profilePicture.trim() !== "" ? user.profilePicture : "https://digitalhealthskills.com/wp-content/uploads/2022/11/3da39-no-user-image-icon-27.png"} alt="Profile" className={styles.profilePic} />
            <h5 className={styles.hfour}>{user.name}</h5>
          </div>
          <div className={styles.arrow} onClick={toggleSidebar}>
            {!isOpen ? <FaCaretRight/> : <FaCaretLeft/>}
          </div>
        </div>
        <div className={styles.items}>
          <h3>Menu</h3>
          <ul className={styles.ulist}>
            <li className={styles.listitems}>
              <FaGamepad className={styles.icon} />
              <Link className={styles.links} to= "/library">View Owned Games</Link>
            </li>
            <li className={styles.listitems}>
              <FaComments className={styles.icon}/>
              <Link className={styles.links} to= "/friends">Chat with Friends</Link>
            </li>
            <li className={styles.listitems}>
              <FaUserFriends className={styles.icon}/>
              <Link className={styles.links} to= "/friends">Friend List</Link>
            </li>
            <li className={styles.listitems}>
              <FaSteam className={styles.icon}/>
              <Link className={styles.links} to= "/library/sync/steam">Link Steam account</Link>
            </li>
            <li className={styles.listitems}>
              <SiEpicgames className={styles.icon}/>
              <Link className={styles.links} to= "/library/sync/epic">Link Epic account</Link>
            </li>
            <li className={styles.listitems}>
              <SiPlaystation className={styles.icon}/>
              <Link className={styles.links} to= "/library/sync/psn">Link PSN account</Link>
            </li>
            <li className={styles.listitems}>
              <FaXbox className={styles.icon}/>
              <Link className={styles.links} to= "/library/sync/xbox">Link Xbox account</Link>
            </li>
            <li className={styles.listitems}>
              <SiNintendo className={styles.icon}/>
              <Link className={styles.links} to= "/library/sync/nintendo">Link Nintendo acc.</Link>
            </li>
            <li className={styles.listitems}>
              <SiGogdotcom className={styles.icon}/>
              <Link className={styles.links} to= "/library/sync/gog">Link GOG account</Link>
            </li>
          </ul>
        </div>
        <div className={styles.account}>
          <div className={styles.accountInfo}>
            <img src={user.profilePicture && user.profilePicture.trim() !== "" ? user.profilePicture : "https://digitalhealthskills.com/wp-content/uploads/2022/11/3da39-no-user-image-icon-27.png"} alt="Profile" className={styles.profilePic} />
            <div>
              <h5 className={styles.hfive}>{user.name}</h5>
              <p className={styles.para}>{user.email}</p>
            </div>
          </div>
          <div className={styles.accountArrow} onClick={toggleAccount}>
            {isAccountOpen ? <FaCaretUp /> : <FaCaretDown />}
          </div>
        </div>
        {isAccountOpen && (
        <div>
          <ul className={styles.accountDropdown}>
            <li className={styles.listitems}>
              <FaCog className={styles.icon}/>
              <Link className={styles.links} to="/settings">Settings</Link>
            </li>
            <li className={styles.listitems}>
              <FaSignOutAlt className={styles.icon}/>
              <Link className={styles.links} to="/logout">Logout</Link>
            </li>
          </ul>
        </div>
        )}
      </div>
    </div>
  );
}

export default Aside;
