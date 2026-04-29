def resolve(path, resolution_func):
    c = open(path, 'r', encoding='utf-8').read()
    while True:
        h_start = c.find('<<<<<<<')
        if h_start == -1: break
        sep = c.find('=======', h_start)
        t_start = c.find('>>>>>>>', sep)
        t_end = c.find('\n', t_start) + 1
        
        head = c[h_start + c[h_start:].find('\n') + 1 : sep]
        remote = c[sep + 8 : t_start]
        
        resolved = resolution_func(path, head, remote)
        c = c[:h_start] + resolved + c[t_end:]
    
    open(path, 'w', encoding='utf-8').write(c)

def resolver(path, head, remote):
    if 'official/route.ts' in path:
        return remote.strip() + '\n' + head.strip() + '\n'
    if 'page.tsx' in path:
        return head
    if 'useDashboardData' in path:
        return head
    if 'BranchView' in path:
        return head if 'MessageSquareQuote' in head else remote
    if 'GlobalView' in path:
        return head if 'MessageSquareQuote' in head else remote
    return head

files = [
    'src/app/api/places/official/route.ts',
    'src/app/page.tsx',
    'src/components/dashboard/hooks/useDashboardData.ts',
    'src/components/dashboard/views/BranchView.tsx',
    'src/components/dashboard/views/GlobalView.tsx'
]

for f in files:
    resolve(f, resolver)
print('Done resolving')
