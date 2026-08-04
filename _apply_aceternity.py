"""Apply Aceternity UI components to PaladinsCat data-display pages."""
import os, re, shutil

BASE = os.path.abspath(r"C:\Users\nabi\PaladinsCat\src\frontend\app")
BACKUP_DIR = os.path.join(os.path.dirname(BASE), "_aceternity_backups")
os.makedirs(BACKUP_DIR, exist_ok=True)

IMPORT_LINE = 'import { SpotlightCard, MovingBorderCard, BackgroundGradientAnimation } from "@/components/aceternity";'

# Pages to skip entirely (thin wrappers, re-exports, stubs - no data rendering in the page itself)
SKIP = {
    "champions/page.tsx", "champions/[name]/page.tsx",
    "players/hall-of-fame/page.tsx", "players/afk-wintrade/page.tsx",
    "players/weirdos/page.tsx", "players/droppers/page.tsx",
    "stats/activity/page.tsx", "stats/winrate/page.tsx",
    "stats/banrate/page.tsx", "stats/ecpm/page.tsx",
    "stats/performance/page.tsx",
    "game/compositions/page.tsx", "game/items/page.tsx", "game/maps/page.tsx",
}

ALL_PAGES = [
    "page.tsx",
    "players/leaderboard/page.tsx", "players/boosted/page.tsx",
    "players/hall-of-fame/page.tsx", "players/afk-wintrade/page.tsx",
    "players/elo/page.tsx", "players/performance/page.tsx",
    "champions/page.tsx", "champions/[name]/page.tsx",
    "builds/page.tsx", "builds/[id]/page.tsx",
    "stats/page.tsx", "stats/metrics/page.tsx",
    "stats/winrate/page.tsx", "stats/banrate/page.tsx",
    "stats/compositions/page.tsx", "stats/egpm/page.tsx", "stats/ecpm/page.tsx",
    "stats/platforms/page.tsx", "stats/tiers/page.tsx", "stats/skins/page.tsx",
    "stats/talents/page.tsx", "stats/loadouts/page.tsx",
    "stats/activity/page.tsx", "stats/performance/page.tsx",
    "matches/page.tsx", "matches/[id]/page.tsx",
    "players/[id]/page.tsx", "players/[id]/champions/page.tsx",
    "players/[id]/loadouts/page.tsx",
    "players/class/[role]/page.tsx",
    "players/cheaters/page.tsx", "players/weirdos/page.tsx",
    "players/alt-accounts/page.tsx", "players/droppers/page.tsx",
    "players/parties/page.tsx", "players/boosted/[id]/page.tsx",
    "players/private-accounts/page.tsx", "players/suspicious/page.tsx",
    "game/compositions/page.tsx", "game/items/page.tsx", "game/maps/page.tsx",
]

def find_last_import_pos(content):
    """Return character position after the last import line."""
    last = -1
    for m in re.finditer(r'^import .+;$', content, re.MULTILINE):
        last = m.end()
    return last

def needs_patch(content):
    """Check if this page needs any patching."""
    if 'aceternity' in content:
        # Check if already applied in JSX
        bg_lines = [l for l in content.split('\n') if 'BackgroundGradientAnimation' in l]
        if any('import' not in l for l in bg_lines):
            return False
        return True  # Has import but not applied in JSX
    return True  # Needs import + application

def get_indent_of_line(content, pos):
    """Get the whitespace indentation at a position."""
    line_start = content.rfind('\n', 0, pos)
    if line_start < 0:
        line_start = 0
    else:
        line_start += 1
    indent = ""
    for c in content[line_start:pos]:
        if c in ' \t':
            indent += c
        else:
            break
    return indent

def apply_page(page_path, content):
    """Apply Aceternity patches. Returns (new_content, changed)."""
    changed = False
    has_import = 'aceternity' in content
    
    # Check if already fully applied
    bg_lines = [l for l in content.split('\n') if 'BackgroundGradientAnimation' in l]
    if has_import and any('import' not in l for l in bg_lines):
        # Already has import + JSX usage — check for z-10 wrapper
        if '"relative z-10"' in content:
            return content, False
        # Has bg anim but no z-10 wrapper — still needs fix
        pass
    
    # Step 1: Add import if missing
    if not has_import:
        pos = find_last_import_pos(content)
        if pos > 0:
            # Check if we need "use client"
            has_client = '"use client"' in content[:300]
            if not has_client:
                content = '"use client";\n\n' + content
                pos += len('"use client";\n\n')
            content = content[:pos] + '\n' + IMPORT_LINE + '\n' + content[pos:]
            changed = True
    
    # Step 2: Find the main return statement of the default export
    # Look for "export default function" 
    exp_match = re.search(r'export default function\s+\w+\s*[\({]', content)
    if not exp_match:
        # Check for alternative: no "use client" server page
        # Try finding any default export
        exp_match = re.search(r'default\s+function\s+\w+', content)
    
    if not exp_match:
        return content, changed  # Can't find function
    
    # Find the opening brace of the function
    func_brace_start = None
    depth = 0
    search_start = exp_match.end()
    for i in range(search_start, min(search_start + 200, len(content))):
        if content[i] == '{':
            func_brace_start = i
            break
    
    if func_brace_start is None:
        return content, changed
    
    # Search for 'return' at depth 1 within the function
    # We need to find a return that's at the top level of the function body
    depth = 0
    first_brace_done = False
    best_return = None
    
    i = func_brace_start
    while i < len(content):
        c = content[i]
        if c == '{':
            if not first_brace_done:
                first_brace_done = True
                continue
            depth += 1
        elif c == '}':
            if depth > 0:
                depth -= 1
            elif first_brace_done:
                break  # End of function body
            else:
                break
        
        if depth == 0 and first_brace_done:
            # At function body level — check for return
            rest = content[i:].lstrip()
            if rest.startswith('return '):
                best_return = i
                break
            if rest.startswith('return ('):
                best_return = i
                break
            if rest.startswith('return <'):
                best_return = i
                break
        
        i += 1
    
    if best_return is None:
        return content, changed
    
    # Step 3: Find the container <div in the return
    return_chunk = content[best_return:best_return+3000]
    
    # Pattern: return (\n    <div className="..."
    div_match = re.search(r'<div\s+className="([^"]*)"', return_chunk)
    if not div_match:
        # Try: return <div
        div_match = re.search(r'return\s*<div\s+className="([^"]*)"', return_chunk)
    
    if not div_match:
        return content, changed
    
    # Get absolute positions
    abs_div_start = best_return + div_match.start()
    abs_div_tag_end = content.find('>', abs_div_start) + 1
    
    orig_class = div_match.group(1)
    
    # Step 4: Add 'relative overflow-hidden' to the container className
    new_class = orig_class
    if 'relative' not in orig_class:
        new_class = orig_class.rstrip("'\"").rstrip() + ' relative'
    if 'overflow-hidden' not in orig_class:
        new_class = new_class.rstrip("'\"").rstrip() + ' overflow-hidden'
    
    # Replace the className in the content
    old_class_str = f'className="{orig_class}"'
    new_class_str = f'className="{new_class}"'
    
    if old_class_str in content and new_class_str not in content:
        content = content.replace(old_class_str, new_class_str, 1)
        changed = True
        # Recompute positions after replacement
        abs_div_start = content.find(new_class_str) - len(new_class_str) + len('className="')
        # Recalculate abs_div_tag_end
        abs_div_tag_end = content.find('>', abs_div_start) + 1
    
    # Step 5: Find the matching closing </div> for the container
    # We need to track div depth starting from the opening tag
    search_from = abs_div_tag_end
    div_depth = 1
    closing_pos = None
    
    i = search_from
    while i < len(content) and div_depth > 0:
        if content[i:i+6] == '</div>':
            div_depth -= 1
            if div_depth == 0:
                closing_pos = i
                break
        elif re.match(r'<div\b', content[i:]):
            div_depth += 1
        i += 1
    
    if closing_pos is None:
        return content, changed
    
    # Step 6: Get indentation
    # Indent before the opening <div
    line_start = content.rfind('\n', best_return, abs_div_start)
    if line_start >= 0:
        indent = content[line_start+1:abs_div_start]
    else:
        indent = '    '
    
    # Indent before the closing </div>
    line_start_close = content.rfind('\n', search_from, closing_pos)
    if line_start_close >= 0:
        close_indent = content[line_start_close+1:closing_pos]
    else:
        close_indent = indent
    
    # Step 7: Inject BackgroundGradientAnimation and z-10 wrapper
    injection_after_open = f'\n{indent}<BackgroundGradientAnimation />\n{indent}<div className="relative z-10">\n'
    injection_before_close = f'{close_indent}</div>\n{close_indent}'
    
    # Insert right after opening <div ...>
    content = content[:abs_div_tag_end] + injection_after_open + content[abs_div_tag_end:closing_pos] + injection_before_close + content[closing_pos:]
    changed = True
    
    return content, changed

def process_all():
    stats = {"modified": [], "skipped": [], "already_done": [], "errors": []}
    
    for page in ALL_PAGES:
        if page in SKIP:
            stats["skipped"].append(page)
            continue
        
        path = os.path.join(BASE, page)
        if not os.path.exists(path):
            stats["errors"].append(f"{page}: not found")
            continue
        
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check if already fully done
        bg_lines = [l for l in content.split('\n') if 'BackgroundGradientAnimation' in l]
        has_import = 'aceternity' in content
        has_bg_jsx = any('import' not in l for l in bg_lines)
        has_z10 = '"relative z-10"' in content
        
        if has_import and has_bg_jsx and has_z10:
            stats["already_done"].append(page)
            continue
        
        try:
            new_content, changed = apply_page(path, content)
            
            if changed:
                # Backup
                safe_name = page.replace('/', '__').replace('[', '').replace(']', '')
                backup_path = os.path.join(BACKUP_DIR, safe_name + '.bak')
                shutil.copy2(path, backup_path)
                
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                
                stats["modified"].append(page)
                print(f"  ✅ {page}")
            else:
                stats["skipped"].append(page)
                print(f"  ⏭️  {page} (no structural change)")
        except Exception as e:
            stats["errors"].append(f"{page}: {e}")
            import traceback
            traceback.print_exc()
            print(f"  ❌ {page}: {e}")
    
    return stats

if __name__ == "__main__":
    stats = process_all()
    print(f"\n{'='*40}")
    print(f"Modified:      {len(stats['modified'])}")
    print(f"Already done:  {len(stats['already_done'])}")
    print(f"Skipped:       {len(stats['skipped'])}")
    print(f"Errors:        {len(stats['errors'])}")
    if stats['errors']:
        for e in stats['errors']:
            print(f"  ERROR: {e}")
