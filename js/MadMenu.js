// MadMenu.js for ModernActiveDesktop
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

// This script handles the menu bar and context menus in ModernActiveDesktop apps
// Dependencies: functions.js (getTextWidth)
// Load libmad.css for the default styles

class MadMenu {
    // menuBar: The menu bar element
    // menuOrder: An array of menu names in the order they appear in the menu bar
    // submenus: An array of submenu names
    // simpleMenus: An array of other context menus that are not part of the menu bar
    // menu names are defined by the id of the menu button, the menu background, and the menu element (e.g. "fileMenuBtn", "fileMenuBg", and "fileMenu")
    constructor(menuBar, menuOrder, submenus = [], simpleMenus = []) {
        this.menuBar = menuBar;
        this.menuOrder = menuOrder;
        this.submenus = submenus;
        this.openedMenu = null;
        this.mouseOverMenu = false;
        this.mouseOverSubmenu = false;
        this.handlingPointerEvent = false;
        this.handlingKeyEvent = false;
        this.boundMenuNavigationHandler = this.menuNavigationHandler.bind(this);
        this.submenuOpenTimer = null;
        this.submenuCloseTimer = null;
        this.shouldNotCloseSubmenu = false;
        this.menuHierarchy = {};
        this.beforeMenuOpenEvent = new Event('beforemenuopen');
        this.afterMenuCloseEvent = new Event('aftermenuclose');

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
                            this.openMenu(elem.dataset.submenu);
                        }, 300);
                    } else if (this.menuHierarchy[menuName].length > 0) {
                        this.delayedCloseMenu(this.menuHierarchy[menuName][0]);
                    }
                });
                elem.addEventListener('pointerleave', () => {
                    if (!this.mouseOverSubmenu) {
                        delete elem.dataset.active;
                        clearTimeout(this.submenuOpenTimer);
                        if (elem.dataset.submenu) {
                            this.delayedCloseMenu(elem.dataset.submenu);
                        }
                    }
                });
                elem.addEventListener('click', () => {
                    if (elem.dataset.submenu) {
                        if (this.openedMenu.id !== elem.dataset.submenu + 'MenuBg') {
                            this.openMenu(elem.dataset.submenu);
                        } else {
                            document.getElementById(elem.dataset.submenu + 'MenuBg').focus();
                        }
                    } else if (!elem.dataset.noClose) {
                        this.closeMenu(menuName);
                    }
                });
            }

            menuBtn.addEventListener('pointerdown', (event) => {
                this.handlingPointerEvent = true;
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
                if (top.ignoreFocusLoss) {
                    return;
                }
                if (event.relatedTarget && event.relatedTarget.dataset.submenuOf === menuName) {
                    return;
                }
                this.closeMenu(menuName);
            });

            menuBg.addEventListener('pointermove', (event) => {
                if (event.clientX > 0 || event.clientY > 0) {
                    menuBg.style.animation = 'none';
                }
            });

            menuBtn.addEventListener('pointerover', () => {
                if (this.menuBar.dataset.active && !this.handlingKeyEvent) {
                    this.mouseOverMenu = true;
                    // openedMenu can be null when the cursor is rapidly moving over the menu buttons
                    if (!this.openedMenu || (this.openedMenu.id !== menuName + 'MenuBg' &&
                        !this.menuHierarchy[menuName].includes(this.openedMenu.id.slice(0, -6))))
                    {
                        this.openMenu(menuName);
                    }
                }
            });

            menuBtn.addEventListener('pointerleave', () => {
                this.mouseOverMenu = false;
            });

            // AccessKey handling
            menuBtn.accessKey = menuBtn.querySelector('u').textContent.toLowerCase();
            menuBtn.addEventListener('click', () => {
                // Limit the event to non-pointer events (accessKey)
                // Pointer events are handled by the pointerdown event listener
                if (!this.handlingPointerEvent && !menuBtn.dataset.active) {
                    this.openMenu(menuName);
                }
                this.handlingPointerEvent = false;
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
                    this.closeMenu(submenu);
                    this.closeMenu(menuBg.dataset.submenuOf);
                    delete this.menuBar.dataset.active;
                });
            }

            menuBg.addEventListener('pointerover', () => {
                this.mouseOverMenu = true;
                this.mouseOverSubmenu = true;
                this.shouldNotCloseSubmenu = true;
                clearTimeout(this.submenuCloseTimer);
                parentMenuItem.dataset.active = true;
            });

            menuBg.addEventListener('pointerleave', () => {
                this.mouseOverMenu = false;
                this.mouseOverSubmenu = false;
                this.shouldNotCloseSubmenu = false;
            });

            menuBg.addEventListener('focusout', (event) => {
                if (top.ignoreFocusLoss) {
                    return;
                }
                if (menuBg.style.display === 'none') {
                    return;
                }
                this.shouldNotCloseSubmenu = false;
                const standalone = !!menuBg.dataset.openStandalone;
                // Prevent closing the submenu when clicking the same menu item in the parent menu
                if (event.relatedTarget && event.relatedTarget.id && event.relatedTarget.id === parentMenuBg.id) {
                    return;
                }
                this.closeMenu(submenu);
                // Prevent closing the parent menu when opening another submenu
                if (event.relatedTarget && event.relatedTarget.id && event.relatedTarget.dataset.submenuOf === menuBg.dataset.submenuOf) {
                    return;
                }
                if (!standalone) {
                    this.closeMenu(menuBg.dataset.submenuOf);
                }
            });
        }

        for (const simpleMenu of simpleMenus) {
            const simpleMenuBg = document.getElementById(simpleMenu + 'MenuBg');
            simpleMenuBg.addEventListener('focusout', () => {
                if (top.ignoreFocusLoss) {
                    return;
                }
                this.closeMenu(simpleMenu);
            });
        }
    }

    openMenu(menuName, standalone) {
        const menuBg = document.getElementById(menuName + 'MenuBg');
        const menu = document.getElementById(menuName + 'Menu');
        const isSubmenu = !!menuBg.dataset.submenuOf;
        let menuBtn;
        let parentMenuBg;
        let parentMenuItem;

        let menuItems;
        const debugItems = menuBg.querySelectorAll('.contextMenuItem.debug');
        if (localStorage.madesktopDebugMode) {
            menuItems = menuBg.querySelectorAll('.contextMenuItem');
            for (const debugItem of debugItems) {
                debugItem.style.display = '';
            }
        } else {
            menuItems = menuBg.querySelectorAll('.contextMenuItem:not(.debug)');
            for (const debugItem of debugItems) {
                debugItem.style.display = 'none';
            }
        }

        menuBg.dispatchEvent(this.beforeMenuOpenEvent);

        if (standalone) {
            menuBg.dataset.openStandalone = true;
        } else {
            if (isSubmenu) {
                // Close other submenus of the same parent menu
                if (this.menuHierarchy[menuBg.dataset.submenuOf].length > 1) {
                    for (const submenu of this.menuHierarchy[menuBg.dataset.submenuOf]) {
                        if (submenu !== menuName) {
                            this.closeMenu(submenu);
                        }
                    }
                }
                parentMenuBg = document.getElementById(menuBg.dataset.submenuOf + 'MenuBg');
                if (parentMenuBg.style.display === 'none') {
                    return;
                }
                let parentMenuItemIndex = Array.from(parentMenuBg.querySelectorAll('.contextMenuItem')).findIndex((elem) => elem.dataset.submenu === menuName);
                parentMenuItem = parentMenuBg.querySelectorAll('.contextMenuItem')[parentMenuItemIndex];
                if (parentMenuItem.classList.contains('disabled')) {
                    return;
                }
            } else {
                // Make sure other menus are closed
                for (const menu of this.menuOrder) {
                    if (menu !== menuName && document.getElementById(menu + 'MenuBg').style.display === 'block') {
                        this.closeMenu(menu);
                    }
                }
                menuBtn = document.getElementById(menuName + 'MenuBtn');
            }
            delete menuBg.dataset.openStandalone;
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
                if (standalone && !standalone.dropdown) {
                    menuBg.style.animation = 'cmDropdownright 0.25s linear';
                    menuBg.style.pointerEvents = 'none';
                    menuBg.addEventListener('animationend', () => {
                        menuBg.style.pointerEvents = '';
                    }, {once: true});
                } else if (isSubmenu) {
                    menuBg.style.animation = 'cmDropright 0.25s linear';
                } else {
                    menuBg.style.animation = 'cmDropdown 0.25s linear';
                }
        }

        for (const item of menuItems) {
            delete item.dataset.active;
        }
        if (standalone) {
            menuBg.style.top = standalone.y + 'px';
            menuBg.style.left = standalone.x + 'px';
        } else {
            let top = '';
            let left = 0;
            if (isSubmenu) {
                top = parentMenuBg.offsetTop + parentMenuItem.offsetTop;
                left = parentMenuBg.offsetLeft + parentMenuBg.offsetWidth - 6;
            } else {
                top = menuBtn.offsetTop + menuBtn.offsetHeight;
                left = menuBtn.offsetLeft;
            }
            if (madDeskMover.isFullscreen) {
                top += parseInt(localStorage.madesktopChanViewTopMargin || '0');
                left += parseInt(localStorage.madesktopChanViewLeftMargin || '75px');
            }
            menuBg.style.top = top + 'px';
            menuBg.style.left = left + 'px';
        }
        menuBg.style.display = 'block';
        const calculatedMenuWidth = this.calcMenuWidth(menuName);
        menuBg.style.width = calculatedMenuWidth + ')';
        menuBg.style.minWidth = 0;
        menu.style.width = calculatedMenuWidth + ' - 2px)';
        menuBg.style.height = this.calcMenuHeight(menuName) + 'px';
        if (!standalone) {
            this.menuBar.dataset.active = true;
            if (isSubmenu) {
                parentMenuItem.dataset.active = true;
            } else {
                menuBtn.dataset.active = true;
            }
        }
        menuBg.focus();
        this.openedMenu = menuBg;
        document.addEventListener('keydown', this.boundMenuNavigationHandler);
    }

    closeMenu(menuName) {
        const menuBg = document.getElementById(menuName + 'MenuBg');
        const standalone = !!menuBg.dataset.openStandalone;
        const isSubmenu = !!menuBg.dataset.submenuOf && !standalone;
        if ((isSubmenu && this.shouldNotCloseSubmenu)) {
            return;
        }
        let menuBtn;
        let parentMenuBg;
        let parentMenuItem;

        if (!standalone) {
            if (isSubmenu) {
                parentMenuBg = document.getElementById(menuBg.dataset.submenuOf + 'MenuBg');
                let parentMenuItemIndex = Array.from(parentMenuBg.querySelectorAll('.contextMenuItem')).findIndex((elem) => elem.dataset.submenu === menuName);
                parentMenuItem = parentMenuBg.querySelectorAll('.contextMenuItem')[parentMenuItemIndex];
            } else {
                menuBtn = document.getElementById(menuName + 'MenuBtn');
            }
        }

        if (this.submenuCloseTimer) {
            clearTimeout(this.submenuCloseTimer);
        }

        menuBg.style.display = 'none';
        if (standalone) {
            delete menuBg.dataset.openStandalone;
        } else if (isSubmenu) {
            delete parentMenuItem.dataset.active;
        } else {
            delete menuBtn.dataset.active;
        }
        if (!this.mouseOverMenu && !isSubmenu && !standalone) {
            delete this.menuBar.dataset.active;
        }

        menuBg.dispatchEvent(this.afterMenuCloseEvent);

        if (isSubmenu && parentMenuBg.style.display !== 'none') {
            parentMenuBg.focus();
            this.openedMenu = parentMenuBg;
        } else {
            this.openedMenu = null;
            document.removeEventListener('keydown', this.boundMenuNavigationHandler);
        }
        //console.log(menuName + ': ' + new Error().stack);
    }

    delayedCloseMenu(menuName) {
        this.submenuCloseTimer = setTimeout(() => {
            this.closeMenu(menuName);
        }, 300);
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
        let parentMenuItem;
        if (this.openedMenu.dataset.submenuOf) {
            parentMenuItem = document.getElementById(this.openedMenu.dataset.submenuOf + 'MenuBg').querySelector('.contextMenuItem[data-active]');
        }
        this.handlingKeyEvent = true;
        this.openedMenu.style.animation = 'none';
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
                    parentMenuItem.dataset.active = true;
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
                    this.openMenu(activeItem.dataset.submenu);
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
                    this.closeMenu(this.openedMenu.id.slice(0, -6));
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

    calcMenuWidth(menuName) {
        const menuBg = document.getElementById(menuName + 'MenuBg');
        const menuItems = menuBg.querySelectorAll('.contextMenuItem');
        menuBg.style.minWidth = '';
        const minWidth = parseInt(getComputedStyle(menuBg).minWidth) || 0;
        const width = Array.from(menuItems).reduce((maxWidth, elem) => {
            const text = elem.textContent;
            const width = getTextWidth(text);
            return Math.max(minWidth, maxWidth, width);
        }, 0);
        return `calc(${width}px + 4.5em`;
    }

    calcMenuHeight(menuName) {
        const menuBg = document.getElementById(menuName + 'MenuBg');
        const separators = menuBg.querySelectorAll('hr');

        let menuItems;
        if (localStorage.madesktopDebugMode) {
            menuItems = menuBg.querySelectorAll('.contextMenuItem');
        } else {
            menuItems = menuBg.querySelectorAll('.contextMenuItem:not(.debug)');
        }
        const menuItemHeight = menuItems[0].offsetHeight;

        let separatorHeight = 0;
        if (separators.length > 0) {
            const styles = getComputedStyle(separators[0]);
            separatorHeight = separators[0].offsetHeight + parseFloat(styles.marginTop) + parseFloat(styles.marginBottom);
        }
        const height = parseInt(menuItems.length * menuItemHeight + separators.length * separatorHeight);
        //console.log(`${menuItems.length} * ${menuItemHeight} + ${separators.length} * ${separatorHeight} = ${height}`)
        return height;
    }
}
window.MadMenu = MadMenu;