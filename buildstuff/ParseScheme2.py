import sys, re

def parse(string):
    return "%02X%02X%02X" % tuple(int(x) for x in re.match('.*="(.*)"', string)[1].split())

def mapper(string, name, filename, base = 3):
    lines = string.split('\n')
    a = f'''/* {name} */
:root {{
    --active-border: #{parse(lines[base+0])};
    --active-title: #{parse(lines[base+1])};
    --app-workspace: #{parse(lines[base+2])};
    --background: #{parse(lines[base+3])};
    --button-alternate-face: #{parse(lines[base+4])};
    --button-dk-shadow: #{parse(lines[base+5])};
    --button-face: #{parse(lines[base+6])};
    --button-hilight: #{parse(lines[base+7])};
    --button-light: #{parse(lines[base+8])};
    --button-shadow: #{parse(lines[base+9])};
    --button-text: #{parse(lines[base+10])};
    --gradient-active-title: #{parse(lines[base+11])};
    --gradient-inactive-title: #{parse(lines[base+12])};
    --gray-text: #{parse(lines[base+13])};
    --hilight: #{parse(lines[base+14])};
    --hilight-text: #{parse(lines[base+15])};
    --hot-tracking-color: #{parse(lines[base+16])};
    --inactive-border: #{parse(lines[base+17])};
    --inactive-title: #{parse(lines[base+18])};
    --inactive-title-text: #{parse(lines[base+19])};
    --info-text: #{parse(lines[base+20])};
    --info-window: #{parse(lines[base+21])};
    --menu: #{parse(lines[base+22])};
    --menu-bar: #{parse(lines[base+30])};
    --menu-hilight: #{parse(lines[base+29])};
    --menu-text: #{parse(lines[base+23])};
    --scrollbar: #{parse(lines[base+24])};
    --title-text: #{parse(lines[base+25])};
    --window: #{parse(lines[base+26])};
    --window-frame: #{parse(lines[base+27])};
    --window-text: #{parse(lines[base+28])};
}}'''
    print(a)
    f = open(f'{filename}.css', 'wb')
    f.write(bytes(a, 'utf-8'))
    f.close()

mapper(open(sys.argv[1], 'r', encoding='utf-16').read(), sys.argv[2], sys.argv[3], int(sys.argv[4]))
