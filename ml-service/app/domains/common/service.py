import re
from bs4 import BeautifulSoup

def robust_text_extraction(content: str):
    """
    Robust text extraction logic for HTML/XML content.
    Handles tables with order preservation and global text capture.
    """
    # Check if the content is plain text (no tags)
    if not re.search(r'<[^>]+>', content):
        return content.replace('\\n', '\n').replace('\\r', '\r').strip()

    # Pre-clean: strip HTML comments
    content = re.sub(r'<!--[\s\S]*?-->', '', content)
    soup = BeautifulSoup(content, 'html.parser')

    # Global Sanitization: Clean all text nodes in the soup before processing
    for node in soup.find_all(string=True):
        if node.string:
            # 1. Handle non-breaking spaces
            cleaned = node.string.replace('\xa0', ' ')
            # 2. Strip MS Word specific junk symbols (Private Use Area)
            cleaned = re.sub(r'[\uf000-\uf0ff]', ' ', cleaned)
            # 3. Collapse internal multiple spaces
            cleaned = re.sub(r'[ \t]+', ' ', cleaned)
            node.string.replace_with(cleaned)

    def clean_whitespace(text):
        if not text:
            return ""
        # Handle literal \n artifacts and trim
        text = text.replace('\\n', ' ').replace('\\r', ' ')
        return re.sub(r'\s+', ' ', text).strip()

    # 1. Process and format ALL tables first
    formatted_tables = []
    tables = soup.find_all("table")
    for i, table in enumerate(tables):
        table_data = []
        for row in table.find_all("tr"):
            cols = row.find_all(["td", "th"])
            cols_text = [clean_whitespace(col.get_text()) for col in cols]
            if any(cols_text):
                table_data.append(cols_text)

        formatted_str = ""
        if table_data:
            # If 2 columns → treat as key-value pairs
            if len(table_data[0]) == 2:
                start_idx = 0
                first_row_joined = " ".join(table_data[0]).lower()
                if "field" in first_row_joined and "value" in first_row_joined:
                    start_idx = 1
                
                lines = []
                for row in table_data[start_idx:]:
                    if len(row) == 2:
                        lines.append(f"{row[0]}: {row[1]}")
                formatted_str = "\n".join(lines)
            else:
                lines = []
                for row in table_data:
                    lines.append(" | ".join(row))
                formatted_str = "\n".join(lines)

        formatted_tables.append(formatted_str)
        
        # Replace the table in the soup with a unique placeholder
        placeholder = soup.new_tag("p")
        placeholder.string = f"__TABLE_PLACEHOLDER_{i}__"
        table.replace_with(placeholder)

    # 2. Extract ALL text from the soup (now containing placeholders)
    # Using separator="\n" preserves structure for div, p, br, etc.
    raw_text = soup.get_text(separator="\n")

    # 3. Final cleanup and table re-injection
    # - Convert literal artifacts again (just in case they were loose)
    # - Normalize &nbsp; and multiple spaces
    text = raw_text.replace('\xa0', ' ').replace('\\n', '\n').replace('\\r', '\r')
    
    # - Deduplicate newlines
    text = re.sub(r'\n{2,}', '\n\n', text)
    
    # - Re-inject formatted tables
    for i, fmt_table in enumerate(formatted_tables):
        placeholder = f"__TABLE_PLACEHOLDER_{i}__"
        text = text.replace(placeholder, f"\n{fmt_table}\n")

    # - Final pass to normalize spacing around tables and deduplicate newlines again
    return re.sub(r'\n{3,}', '\n\n', text).strip()
