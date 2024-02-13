// libmad-menu.js for ModernActiveDesktop
// Made by Ingan121
// Licensed under the MIT License

'use strict';

class MadMenu {
    constructor(menuBar, menuOrder) {
        this.menuBar = menuBar;
        this.menuOrder = menuOrder;
        this.openedMenu = null;
        this.mouseOverMenu = false;
        this.handlingKeyEvent = false;
        this.boundMenuNavigationHandler = this.menuNavigationHandler.bind(this);

        for (const menuName of menuOrder) {
            const menuBtn = document.getElementById(menuName + 'MenuBtn');
            const menuBg = document.getElementById(menuName + 'MenuBg');
            const menuItems = menuBg.querySelectorAll('.contextMenuItem');

            for (const elem of menuItems) {
                elem.addEventListener('mouseover', () => {
                    for (const item of menuItems) {
                        delete item.dataset.active;
                    }
                    elem.dataset.active = true;
                });
                elem.addEventListener('mouseleave', () => {
                    delete elem.dataset.active;
                });
                elem.addEventListener('click', () => {
                    this.closeMenu(menuName);
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

            menuBg.addEventListener('focusout', () => {
                this.closeMenu(menuName);
            });

            menuBtn.addEventListener('mouseover', () => {
                if (this.menuBar.dataset.active && !this.handlingKeyEvent) {
                    this.mouseOverMenu = true;
                    this.openMenu(menuName);
                }
            });

            menuBtn.addEventListener('mouseout', () => {
                this.mouseOverMenu = false;
            });
        }
    }

    openMenu(menuName) {
        const menuBtn = document.getElementById(menuName + 'MenuBtn');
        const menuBg = document.getElementById(menuName + 'MenuBg');
        const menuItems = menuBg.querySelectorAll('.contextMenuItem');
    
        switch (localStorage.madesktopCmAnimation) {
            case 'none':
                menuBg.style.animation = 'none';
                break;
            case 'slide':
                menuBg.style.animation = 'cmDropdown 0.25s linear';
                break;
            case 'fade':
                menuBg.style.animation = 'fade 0.2s';
        }
        for (const item of menuItems) {
            delete item.dataset.active;
        }
        if (madDeskMover.isFullscreen) {
            menuBg.style.left = menuBtn.offsetLeft + parseInt(localStorage.madesktopChanViewLeftMargin || '75px') + 'px';
        } else {
            menuBg.style.left = menuBtn.offsetLeft + 'px';
        }
        menuBg.style.display = 'block';
        this.menuBar.dataset.active = true;
        menuBtn.dataset.active = true;
        menuBg.focus();
        this.openedMenu = menuBg;
        document.addEventListener('keydown', this.boundMenuNavigationHandler);
    }
    
    closeMenu(menuName) {
        const menuBtn = document.getElementById(menuName + 'MenuBtn');
        const menuBg = document.getElementById(menuName + 'MenuBg');
        menuBg.style.display = 'none';
        delete menuBtn.dataset.active;
        if (!this.mouseOverMenu) {
            delete this.menuBar.dataset.active;
        }
        this.openedMenu = null;
        document.removeEventListener('keydown', this.boundMenuNavigationHandler);
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
                if (this.menuOrder.length === 1) {
                    break;
                }
                const nextMenu = this.menuOrder[(this.menuOrder.indexOf(this.openedMenu.id.slice(0, -6)) + 1) % this.menuOrder.length];
                this.closeMenu(this.openedMenu.id.slice(0, -6));
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