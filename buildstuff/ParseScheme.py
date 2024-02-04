import sys, re, textwrap

# Python script to parse WinClassicThemeConfig scheme reg files into CSS variables
# WinClassicThemeConfig: https://gitlab.com/ftortoriello/WinClassicThemeConfig/-/releases

def main():
    reg_texts = {}
    filename_map = {}
    f = open(sys.argv[1], 'r', encoding='utf-8')
    cnt = -1
    name = ''
    for line in f:
        if cnt != -1:
            reg_texts[name] += line
            #print(line, end='')
            cnt += 1
        if cnt == 31:
            cnt = -1
            filename = name.split(' (')[0].replace(' ', '_').lower().replace('#', '').replace(',', '').replace('_-_', '_').replace('__', '_').replace('!', '').replace('win_', 'win')
            filename_map[filename] = name
            mapper(reg_texts[name], name, filename)
        if line[0] == '[':
            if line.count('\\') == 4:
                cnt = 0
                name = re.match('\[.*\\\\(.*)\]', line)[1]
                reg_texts[name] = ''
                print(name)
    f.close()
    print()
    print_html(filename_map)

def parse(string):
    reverse_color = re.match('.*:00(.*)', string)[1]
    color_list = textwrap.wrap(reverse_color, 2)
    color_list.reverse()
    color = ''.join(color_list)
    return color.upper()

def mapper(string, name, filename):
    lines = string.split('\n')
    css = f'''/* {name} */
:root {{
    --active-border: #{parse(lines[10])};
    --active-title: #{parse(lines[2])};
    --app-workspace: #{parse(lines[12])};
    --background: #{parse(lines[1])};
    --button-alternate-face: #{parse(lines[25])};
    --button-dk-shadow: #{parse(lines[21])};
    --button-face: #{parse(lines[15])};
    --button-hilight: #{parse(lines[20])};
    --button-light: #{parse(lines[22])};
    --button-shadow: #{parse(lines[16])};
    --button-text: #{parse(lines[18])};
    --gradient-active-title: #{parse(lines[27])};
    --gradient-inactive-title: #{parse(lines[28])};
    --gray-text: #{parse(lines[17])};
    --hilight: #{parse(lines[13])};
    --hilight-text: #{parse(lines[14])};
    --hot-tracking-color: #{parse(lines[26])};
    --inactive-border: #{parse(lines[11])};
    --inactive-title: #{parse(lines[3])};
    --inactive-title-text: #{parse(lines[19])};
    --info-text: #{parse(lines[23])};
    --info-window: #{parse(lines[24])};
    --menu: #{parse(lines[4])};
    --menu-bar: #{parse(lines[30])};
    --menu-hilight: #{parse(lines[29])};
    --menu-text: #{parse(lines[7])};
    --scrollbar: #{parse(lines[0])};
    --title-text: #{parse(lines[9])};
    --window: #{parse(lines[5])};
    --window-frame: #{parse(lines[6])};
    --window-text: #{parse(lines[8])};
}}'''
    print(css)
    f = open(f'{filename}.css', 'wb')
    f.write(bytes(css, 'utf-8'))
    f.close()

def print_html(filename_map):
    html = ''
    for filename in filename_map:
        html += f'<option value="{filename}">{filename_map[filename]}</option>\n'
    print(html)

main()