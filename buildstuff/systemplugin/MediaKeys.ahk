#SingleInstance Force
#NoTrayIcon

; Fallback when MediaControlCLI.exe fails to initialize SMTC

player := FindMediaPlayer()
Switch %0%
{
    Case "playpause":
        SendMessage, 0x319, 0, 0xE0000,, %player%
    Case "next":
        SendMessage, 0x319, 0, 0xB0000,, %player%
    Case "prev":
        SendMessage, 0x319, 0, 0xC0000,, %player%
    Case "stop":
        SendMessage, 0x319, 0, 0xD0000,, %player%
    Case "volup":
        SoundSet, +5
    Case "voldown":
        SoundSet, -5
    Case "mute":
        SoundSet, +1, , mute
    Case "findplayer":
        MsgBox %player%
    Default:
        MsgBox, Supported commands: playpause`, next`, prev`, stop`, volup`, voldown`, mute
}

FindMediaPlayer() {
    DetectHiddenWindows, On
    ; Avoid OSD if possible
    if (WinExist("ahk_exe Spotify.exe")) {
        return "ahk_exe Spotify.exe"
    }
    ; Too long, didn't test
    if (WinExist("ahk_class WMPlayerApp")) {
        return "ahk_class WMPlayerApp"
    }
    if (WinExist("ahk_exe vlc.exe")) {
        return "ahk_exe vlc.exe"
    }
    if (WinExist("ahk_exe iTunes.exe")) {
        return "ahk_exe iTunes.exe"
    }
    if (WinExist("ahk_exe foobar2000.exe")) {
        return "ahk_exe foobar2000.exe"
    }
    if (WinExist("ahk_exe MusicBee.exe")) {
        return "ahk_exe MusicBee.exe"
    }
    if (WinExist("ahk_exe Winamp.exe")) {
        return "ahk_exe Winamp.exe"
    }
    if (WinExist("ahk_exe AIMP.exe")) {
        return "ahk_exe AIMP.exe"
    }
    if (WinExist("ahk_exe AIMP3.exe")) {
        return "ahk_exe AIMP3.exe"
    }
    if (WinExist("ahk_exe mpc-be.exe")) {
        return "ahk_exe mpc-be.exe"
    }
    if (WinExist("ahk_exe mpc-be64.exe")) {
        return "ahk_exe mpc-be64.exe"
    }
    if (WinExist("ahk_exe PotPlayer64.exe")) {
        return "ahk_exe PotPlayer64.exe"
    }
    if (WinExist("ahk_exe PotPlayer.exe")) {
        return "ahk_exe PotPlayer.exe"
    }
    if (WinExist("ahk_exe PotPlayerMini64.exe")) {
        return "ahk_exe PotPlayerMini64.exe"
    }
    if (WinExist("ahk_exe PotPlayerMini.exe")) {
        return "ahk_exe PotPlayerMini.exe"
    }
    if (WinExist("ahk_exe mpc-hc.exe")) {
        return "ahk_exe mpc-hc.exe"
    }
    if (WinExist("ahk_exe mpc-hc64.exe")) {
        return "ahk_exe mpc-hc64.exe"
    }
    if (WinExist("ahk_exe Plexamp.exe")) {
        return "ahk_exe Plexamp.exe"
    }
    if (WinExist("ahk_exe Clementine.exe")) {
        return "ahk_exe Clementine.exe"
    }
    if (WinExist("ahk_exe Roon.exe")) {
        return "ahk_exe Roon.exe"
    }
    if (WinExist("ahk_exe TIDAL.exe")) {
        return "ahk_exe TIDAL.exe"
    }
    return "Program Manager" ; fallback, same effect as Send {Media_Play_Pause} including the OSD
    ; Chromium & Firefox: also same as Send {Media_Play_Pause} (they just redirect the window message to media keys)
    ; Spotify notes: it hooks the media keys only if SMTC (media overlay) is disabled in the settings.
    ; If enabled, it won't work unless pointing to the Spotify window when stock explorer.exe is not running (= no SMTC).
}