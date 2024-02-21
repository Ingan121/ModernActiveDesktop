// libmad-menu.js for ModernActiveDesktop
// Made by Ingan121
// Licensed under the MIT License

'use strict';

class MadMenu {
    constructor(menuBar, menuOrder, submenus = []) {
        this.menuBar = menuBar;
        this.menuOrder = menuOrder;
        this.submenus = submenus;
        this.openedMenu = null;
        this.mouseOverMenu = false;
        this.handlingKeyEvent = false;
        this.boundMenuNavigationHandler = this.menuNavigationHandler.bind(this);
        this.submenuOpenTimer = null;
        this.submenuCloseTimer = null;
        this.shouldNotCloseSubmenu = false;
        this.menuHierarchy = {};

        for (const menuName of menuOrder) {
            this.menuHierarchy[menuName] = [];
            const menuBtn = document.getElementById(menuName + 'MenuBtn');
            const menuBg = document.getElementById(menuName + 'MenuBg');
            const menuItems = menuBg.querySelectorAll('.contextMenuItem');

            for (const elem of menuItems) {
                if (elem.dataset.submenu) {
                    this.menuHierarchy[menuName].push(elem.dataset.submenu);
                }
                elem.addEventListener('pointerover', () => {
                    for (const item of menuItems) {
                        delete item.dataset.active;
                    }
                    elem.dataset.active = true;
                    clearTimeout(this.submenuOpenTimer);
                    if (elem.dataset.submenu) {
                        this.submenuOpenTimer = setTimeout(() => {
                            this.openMenu(elem.dataset.submenu, true);
                        }, 300);
                    } else if (this.menuHierarchy[menuName].length > 0) {
                        this.delayedCloseMenu(this.menuHierarchy[menuName][0], true);
                    }
                });
                elem.addEventListener('pointerleave', () => {
                    delete elem.dataset.active;
                    clearTimeout(this.submenuOpenTimer);
                    if (elem.dataset.submenu) {
                        this.delayedCloseMenu(elem.dataset.submenu, true);
                    }
                });
                elem.addEventListener('click', () => {
                    if (elem.dataset.submenu) {
                        this.openMenu(elem.dataset.submenu, true);
                    } else {
                        this.closeMenu(menuName);
                    }
                });
            }

            menuBtn.addEventListener('pointerdown', (event) => {
                if (menuBtn.dataset.active) {
                    this.mouseOverMenu = false;
                    this.closeMenu(menuName);
                    return;
                }
                this.openMenu(menuName);
                event.preventDefault(); // Prevent focusout event
                madBringToTop(); // But keep the window activation working
            });

            menuBg.addEventListener('focusout', (event) => {
                if (event.relatedTarget && event.relatedTarget.dataset.submenuOf === menuName) {
                    return;
                }
                this.closeMenu(menuName);
            });

            menuBtn.addEventListener('pointerover', () => {
                if (this.menuBar.dataset.active && !this.handlingKeyEvent) {
                    this.mouseOverMenu = true;
                    this.openMenu(menuName);
                }
            });

            menuBtn.addEventListener('pointerleave', () => {
                this.mouseOverMenu = false;
            });
        }

        for (const submenu of submenus) {
            const menuBg = document.getElementById(submenu + 'MenuBg');
            const menuItems = menuBg.querySelectorAll('.contextMenuItem');
            const parentMenuBg = document.getElementById(menuBg.dataset.submenuOf + 'MenuBg');
            const parentMenuItemIndex = Array.from(parentMenuBg.querySelectorAll('.contextMenuItem')).findIndex((elem) => elem.dataset.submenu === submenu);
            const parentMenuItem = parentMenuBg.querySelectorAll('.contextMenuItem')[parentMenuItemIndex];

            for (const elem of menuItems) {
                elem.addEventListener('pointerover', () => {
                    for (const item of menuItems) {
                        delete item.dataset.active;
                    }
                    elem.dataset.active = true;
                });
                elem.addEventListener('pointerleave', () => {
                    delete elem.dataset.active;
                });
                elem.addEventListener('click', () => {
                    this.shouldNotCloseSubmenu = false;
                    this.closeMenu(submenu, true);
                    this.closeMenu(menuBg.dataset.submenuOf);
                    delete this.menuBar.dataset.active;
                });
            }

            menuBg.addEventListener('pointerover', () => {
                this.mouseOverMenu = true;
                this.shouldNotCloseSubmenu = true;
                clearTimeout(this.submenuCloseTimer);
                parentMenuItem.dataset.active = true;
            });

            menuBg.addEventListener('pointerleave', () => {
                this.mouseOverMenu = false;
                this.shouldNotCloseSubmenu = false;
            });

            menuBg.addEventListener('focusout', (event) => {
                if (menuBg.style.display === 'none') {
                    return;
                }
                this.shouldNotCloseSubmenu = false;
                this.closeMenu(submenu, true);
                if (event.relatedTarget && event.relatedTarget.id && event.relatedTarget.id === parentMenuBg.id) {
                    return;
                }
                this.closeMenu(menuBg.dataset.submenuOf);
            });
        }
    }

    openMenu(menuName, isSubmenu = false) {
        const menuBg = document.getElementById(menuName + 'MenuBg');
        const menuItems = menuBg.querySelectorAll('.contextMenuItem');
        let menuBtn;
        let parentMenuBg;
        let parentMenuItem;
        
        if (isSubmenu) {
            parentMenuBg = document.getElementById(menuBg.dataset.submenuOf + 'MenuBg');
            if (parentMenuBg.style.display === 'none') {
                return;
            }
            let parentMenuItemIndex = Array.from(parentMenuBg.querySelectorAll('.contextMenuItem')).findIndex((elem) => elem.dataset.submenu === menuName);
            parentMenuItem = parentMenuBg.querySelectorAll('.contextMenuItem')[parentMenuItemIndex];
        } else {
            menuBtn = document.getElementById(menuName + 'MenuBtn');
        }
    
        switch (localStorage.madesktopCmAnimation) {
            case 'none':
                menuBg.style.animation = 'none';
                break;
            case 'fade':
                menuBg.style.animation = 'fade 0.2s';
                break;
            case 'slide':
            default:
                if (isSubmenu) {
                    menuBg.style.animation = 'cmDropright 0.25s linear';
                } else {
                    menuBg.style.animation = 'cmDropdown 0.25s linear';
                }
        }

        for (const item of menuItems) {
            delete item.dataset.active;
        }
        let left = 0;
        if (isSubmenu) {
            left = parentMenuBg.offsetLeft + parentMenuBg.offsetWidth - 6;
        } else {
            left = menuBtn.offsetLeft;
        }
        if (madDeskMover.isFullscreen) {
            left += parseInt(localStorage.madesktopChanViewLeftMargin || '75px');
        }
        menuBg.style.left = left + 'px';
        menuBg.style.display = 'block';
        this.menuBar.dataset.active = true;
        if (isSubmenu) {
            parentMenuItem.dataset.active = true;
        } else {
            menuBtn.dataset.active = true;
        }
        menuBg.focus();
        this.openedMenu = menuBg;
        document.addEventListener('keydown', this.boundMenuNavigationHandler);
    }
    
    closeMenu(menuName, isSubmenu = false) {
        if ((isSubmenu && this.shouldNotCloseSubmenu)) {
            return;
        }
        const menuBg = document.getElementById(menuName + 'MenuBg');
        let menuBtn;
        let parentMenuBg;
        let parentMenuItem;

        if (isSubmenu) {
            parentMenuBg = document.getElementById(menuBg.dataset.submenuOf + 'MenuBg');
            let parentMenuItemIndex = Array.from(parentMenuBg.querySelectorAll('.contextMenuItem')).findIndex((elem) => elem.dataset.submenu === menuName);
            parentMenuItem = parentMenuBg.querySelectorAll('.contextMenuItem')[parentMenuItemIndex];
        } else {
            menuBtn = document.getElementById(menuName + 'MenuBtn');
        }

        if (this.submenuCloseTimer) {
            clearTimeout(this.submenuCloseTimer);
        }

        menuBg.style.display = 'none';
        if (isSubmenu) {
            delete parentMenuItem.dataset.active;
        } else {
            delete menuBtn.dataset.active;
        }
        if (!this.mouseOverMenu && !isSubmenu) {
            delete this.menuBar.dataset.active;
        }
        this.openedMenu = null;
        document.removeEventListener('keydown', this.boundMenuNavigationHandler);
        if (isSubmenu && parentMenuBg.style.display !== 'none') {
            parentMenuBg.focus();
            this.openedMenu = parentMenuBg;
            document.addEventListener('keydown', this.boundMenuNavigationHandler);
        }
        //console.log(menuName + ': ' + new Error().stack);
    }

    delayedCloseMenu(menuName, isSubmenu = false, delay) {
        if (typeof delay !== "number") {
            delay = 300;
        }
        this.submenuCloseTimer = setTimeout(() => {
            this.closeMenu(menuName, isSubmenu);
        }, delay);
    }

    menuNavigationHandler(event) {
        if (!this.openedMenu) {
            return;
        }
        let menuItems;
        if (localStorage.madesktopDebugMode) {
            menuItems = this.openedMenu.querySelectorAll('.contextMenuItem');
        } else {
            menuItems = this.openedMenu.querySelectorAll('.contextMenuItem:not(.debug)');
        }
        const activeItem = this.openedMenu.querySelector('.contextMenuItem[data-active]');
        const activeItemIndex = Array.from(menuItems).indexOf(activeItem);
        this.handlingKeyEvent = true;
        switch (event.key) {
            case "Escape":
                this.mouseOverMenu = false;
                this.openedMenu.blur();
                break;
            case "ArrowUp":
                if (activeItem) {
                    delete activeItem.dataset.active;
                    if (activeItemIndex > 0) {
                        menuItems[activeItemIndex - 1].dataset.active = true;
                    } else {
                        menuItems[menuItems.length - 1].dataset.active = true;
                    }
                } else {
                    menuItems[menuItems.length - 1].dataset.active = true;
                }
                break;
            case "ArrowDown":
                if (activeItem) {
                    delete activeItem.dataset.active;
                    if (activeItemIndex < menuItems.length - 1) {
                        menuItems[activeItemIndex + 1].dataset.active = true;
                    } else {
                        menuItems[0].dataset.active = true;
                    }
                } else {
                    menuItems[0].dataset.active = true;
                }
                break;
            case "ArrowLeft":
                if (this.openedMenu.dataset.submenuOf) {
                    this.closeMenu(this.openedMenu.id.slice(0, -6), true);
                    this.openedMenu.querySelector('.contextMenuItem').dataset.active = true;
                    this.menuBar.dataset.active = true;
                    break;
                }
                if (this.menuOrder.length === 1) {
                    break;
                }
                const prevMenu = this.menuOrder[(this.menuOrder.indexOf(this.openedMenu.id.slice(0, -6)) + this.menuOrder.length - 1) % this.menuOrder.length];
                this.closeMenu(this.openedMenu.id.slice(0, -6));
                this.openMenu(prevMenu);
                this.openedMenu.querySelector('.contextMenuItem').dataset.active = true;
                this.menuBar.dataset.active = true;
                break;
            case "ArrowRight":
                if (activeItem && activeItem.dataset.submenu) {
                    this.openMenu(activeItem.dataset.submenu, true);
                    this.openedMenu.querySelector('.contextMenuItem').dataset.active = true;
                    this.menuBar.dataset.active = true;
                    break;
                }
                if (this.menuOrder.length === 1) {
                    break;
                }
                let nextMenu;
                if (this.openedMenu.dataset.submenuOf) {
                    nextMenu = this.menuOrder[(this.menuOrder.indexOf(this.openedMenu.dataset.submenuOf) + 1) % this.menuOrder.length];
                    this.closeMenu(this.openedMenu.id.slice(0, -6), true);
                } else {
                    nextMenu = this.menuOrder[(this.menuOrder.indexOf(this.openedMenu.id.slice(0, -6)) + 1) % this.menuOrder.length];
                    this.closeMenu(this.openedMenu.id.slice(0, -6));
                }
                this.openMenu(nextMenu);
                this.openedMenu.querySelector('.contextMenuItem').dataset.active = true;
                this.menuBar.dataset.active = true;
                break;
            case "Enter":
                if (activeItem) {
                    activeItem.click();
                } else {
                    this.openedMenu.blur();
                    break;
                }
                break;
            default:
                const shortcutsKeys = this.openedMenu.getElementsByTagName('u');
                for (const shortcutKey of shortcutsKeys) {
                    if (event.key === shortcutKey.textContent.toLowerCase()) {
                        shortcutKey.parentElement.click();
                        break;
                    }
                }
        }
        this.handlingKeyEvent = false;
        event.preventDefault();
        event.stopPropagation();
    }
}