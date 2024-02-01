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
        #print(cnt)
        if cnt != -1:
            if 'Font' in line or '"' not in line:
                continue
            elif 'Color' in line:
                cnt = 10
            else:
                reg_texts[name] += line
                #print(line, end='')
                cnt += 1
        if cnt == 10:
            cnt = -1
            filename = name.split(' (')[0].replace(' ', '_').lower().replace('#', '').replace(',', '').replace('_-_', '_').replace('__', '_').replace('!', '').replace('win_', 'win')
            if filename == 'windows_classic' or filename == 'orange' or filename == 'oxygen_gold':
                cnt = -1
                continue
            elif filename == 'windows_10':
                filename = 'aero'
            elif filename == 'windows_standard':
                filename = '2k'
            elif filename == 'windows_98':
                pass
            elif filename == 'windows_xp_blue':
                filename = 'xp'
            elif filename == 'windows_xp_olive_green':
                filename = 'xp_olive'
            elif filename == 'windows_classic_95':
                filename = '95'
            elif filename[0:8] == 'windows_':
                filename = filename[8:]
            elif '-bit' in filename:
                filename = filename.replace('-bit', '')
            filename_map[filename] = name
            #print(reg_texts[name])
            mapper(reg_texts[name], name, filename)
        if line[0] == '[':
            if line.count('\\') == 5:
                match = re.match('\[.*\\\\(.*)\\\\(.*)\]', line)
                variant = match[2]
                if '-' in variant and variant != '1-Normal':
                    continue
                if '%' in variant and variant != '100%':
                    continue
                if variant == 'Reduced':
                    continue
                cnt = 0
                name = match[1] + ' (' + match[2] + ')'
                reg_texts[name] = ''
                print(name)
    f.close()
    print()

def parse(string):
    print(string)
    return int(re.match('.*:000000(.*)', string)[1], 16)

def mapper(string, name, filename):
    lines = string.split('\n')
    border = parse(lines[0])
    if (len(lines) == 11):
        border += parse(lines[9])
    css = open(f'{filename}.css', 'r').read().replace('}', '')

    css += '    '
    if filename[0:2] == 'xp' or filename == 'aero':
        css += '--flat-menus: mbcm;'
    elif re.match('win[1-3].*', filename) or filename == '95':
        css += '--flat-menus: mb;'
    else:
        css += '--flat-menus: none;'
    css += '\n    '

    if filename == '2k' or filename[0:2] == 'xp' or filename == 'aero':
        css += '--menu-animation: fade;'
    elif re.match('win[1-3].*', filename) or filename == '95':
        css += '--menu-animation: none;'
    else:
        css += '--menu-animation: slide;'
    css += '\n    '

    if filename[0:2] == 'xp' or filename == 'aero':
        css += '--menu-shadow: true;'
    else:
        css += '--menu-shadow: false;'

    css += f'''
    --scrollbar-size: {parse(lines[1])}px;
    --menu-height: {parse(lines[8])}px;
    --palette-title-height: {parse(lines[6])}px;
}}
.window {{
    --extra-border-size: {border}px;
    --extra-title-height: {parse(lines[4]) - 20}px;
}}'''
    print(css)
    f = open(f'{filename}.css', 'wb')
    f.write(bytes(css, 'utf-8'))
    f.close()

main()