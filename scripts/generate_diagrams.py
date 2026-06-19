"""Generate UML diagrams for the graduation report."""
from pathlib import Path

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, Ellipse, FancyArrowPatch, Rectangle

ROOT = Path(__file__).resolve().parents[1]
DIAGRAMS = ROOT / 'docs' / 'diagrams'
DIAGRAMS.mkdir(parents=True, exist_ok=True)


def draw_use_case_diagram():
    fig, ax = plt.subplots(figsize=(14, 10))
    ax.set_xlim(0, 14)
    ax.set_ylim(0, 10)
    ax.axis('off')
    ax.set_title('Figure 1 — Use Case Diagram\nJadah Hail Smart Tourism Platform',
                 fontsize=14, fontweight='bold', pad=16)

    boundary = FancyBboxPatch(
        (3.2, 0.8), 8.8, 8.4,
        boxstyle='round,pad=0.02',
        linewidth=2, edgecolor='#1e3a5f', facecolor='#f8fafc', linestyle='--'
    )
    ax.add_patch(boundary)
    ax.text(7.6, 9.0, 'Jadah Hail Tourism System', ha='center', va='center',
            fontsize=11, fontweight='bold', color='#1e3a5f')

    def use_case(cx, cy, label, w=2.2, h=0.55):
        e = Ellipse((cx, cy), w, h, facecolor='white', edgecolor='#2563eb', linewidth=1.5)
        ax.add_patch(e)
        ax.text(cx, cy, label, ha='center', va='center', fontsize=8)

    def actor(x, y, label, side='left'):
        ax.plot(x, y + 0.35, 'o', color='#334155', markersize=10)
        ax.plot([x, x], [y + 0.25, y - 0.15], color='#334155', linewidth=2)
        ax.plot([x - 0.2, x + 0.2], [y + 0.05, y + 0.05], color='#334155', linewidth=2)
        ax.plot([x, x - 0.2], [y - 0.15, y - 0.45], color='#334155', linewidth=2)
        ax.plot([x, x + 0.2], [y - 0.15, y - 0.45], color='#334155', linewidth=2)
        tx = x - 0.9 if side == 'left' else x + 0.9
        ha = 'right' if side == 'left' else 'left'
        ax.text(tx, y - 0.65, label, ha=ha, va='top', fontsize=9, fontweight='bold')

    def link(actor_xy, case_xy):
        ax.annotate('', xy=case_xy, xytext=actor_xy,
                    arrowprops=dict(arrowstyle='-', color='#64748b', lw=1))

    cases = {
        'browse': (5.0, 7.5, 'Browse Places'),
        'details': (8.2, 7.5, 'View Place\nDetails'),
        'map': (5.0, 6.3, 'View Map'),
        'events': (8.2, 6.3, 'View Events'),
        'routes': (5.0, 5.1, 'View Routes'),
        'assistant': (8.2, 5.1, 'Use Assistant'),
        'language': (6.6, 4.0, 'Switch Language'),
        'login': (5.0, 2.8, 'Login'),
        'favorite': (8.2, 2.8, 'Add Favorite'),
        'review': (6.6, 1.7, 'Submit Review'),
        'dashboard': (10.5, 6.3, 'View\nDashboard'),
        'manage': (10.5, 4.8, 'Manage\nContent'),
        'analytics': (10.5, 3.3, 'View\nAnalytics'),
    }
    for cx, cy, label in cases.values():
        use_case(cx, cy, label)

    actor(1.2, 6.5, 'Visitor', 'left')
    actor(1.2, 3.0, 'Registered\nUser', 'left')
    actor(12.8, 5.0, 'Admin', 'right')

    for c in ['browse', 'map', 'events', 'routes', 'assistant', 'language']:
        cx, cy, _ = cases[c]
        link((1.6, 6.5), (cx - 1.0 if cx < 7 else cx - 0.5, cy))

    link((1.6, 3.0), (cases['login'][0] - 0.8, cases['login'][1]))
    link((1.6, 3.0), (cases['favorite'][0] - 0.8, cases['favorite'][1]))
    link((1.6, 3.0), (cases['review'][0] - 0.8, cases['review'][1]))
    link((1.6, 3.0), (cases['browse'][0] - 0.8, cases['browse'][1]))

    link((12.4, 5.0), (cases['dashboard'][0] + 0.6, cases['dashboard'][1]))
    link((12.4, 5.0), (cases['manage'][0] + 0.6, cases['manage'][1]))
    link((12.4, 5.0), (cases['analytics'][0] + 0.6, cases['analytics'][1]))

    ax.annotate('', xy=(cases['login'][0], cases['login'][1] + 0.35),
                xytext=(cases['review'][0], cases['review'][1] - 0.35),
                arrowprops=dict(arrowstyle='->', color='#dc2626', lw=1.2, linestyle='dashed'))
    ax.text(6.0, 2.15, '<<include>>', fontsize=7, color='#dc2626', style='italic')

    ax.annotate('', xy=(cases['details'][0], cases['details'][1] - 0.35),
                xytext=(cases['browse'][0], cases['browse'][1] - 0.35),
                arrowprops=dict(arrowstyle='->', color='#059669', lw=1.2, linestyle='dashed'))
    ax.text(6.4, 7.0, '<<extend>>', fontsize=7, color='#059669', style='italic')

    out = DIAGRAMS / 'use_case_diagram.png'
    fig.tight_layout()
    fig.savefig(out, dpi=220, bbox_inches='tight', facecolor='white')
    plt.close(fig)
    return out


def draw_sequence_diagram():
    fig, ax = plt.subplots(figsize=(13, 9))
    ax.set_xlim(0, 13)
    ax.set_ylim(0, 9)
    ax.axis('off')
    ax.set_title('Figure 2 — Sequence Diagram\nSubmit Review Flow',
                 fontsize=14, fontweight='bold', pad=16)

    participants = [
        (1.5, 'User'),
        (4.5, 'React\nFrontend'),
        (7.5, 'Django\nREST API'),
        (10.5, 'SQLite\nDatabase'),
    ]
    top_y = 8.0
    bottom_y = 0.8
    lifelines = {}

    for x, name in participants:
        box = FancyBboxPatch(
            (x - 0.85, top_y - 0.35), 1.7, 0.7,
            boxstyle='round,pad=0.02', facecolor='#dbeafe', edgecolor='#2563eb', linewidth=1.5
        )
        ax.add_patch(box)
        ax.text(x, top_y, name, ha='center', va='center', fontsize=9, fontweight='bold')
        ax.plot([x, x], [top_y - 0.35, bottom_y], '--', color='#94a3b8', linewidth=1)
        lifelines[name.split('\n')[0]] = x

    u, r, d, s = lifelines['User'], lifelines['React'], lifelines['Django'], lifelines['SQLite']

    messages = [
        (7.5, u, r, '1. Fill review form & click Submit'),
        (7.0, r, d, '2. POST /api/v1/reviews/ (+ CSRF, Session)'),
        (6.5, d, d, '3. Validate IsAuthenticated'),
        (6.0, d, s, '4. INSERT Review record'),
        (5.5, s, d, '5. Return success'),
        (5.0, d, r, '6. JSON response (201 Created)'),
        (4.5, r, r, '7. Update review list in UI'),
        (4.0, r, u, '8. Display confirmation'),
    ]

    def arrow(y, x1, x2, label, self_msg=False):
        color = '#1e40af' if not self_msg else '#7c3aed'
        if self_msg:
            ax.annotate('', xy=(x1 + 0.5, y - 0.15), xytext=(x1, y),
                        arrowprops=dict(arrowstyle='->', color=color, lw=1.3,
                                        connectionstyle='arc3,rad=-0.4'))
        else:
            style = '->' if x2 > x1 else '<-'
            ax.annotate('', xy=(x2, y), xytext=(x1, y),
                        arrowprops=dict(arrowstyle=style, color=color, lw=1.3))
        lx = (x1 + x2) / 2 if not self_msg else x1 + 0.55
        ax.text(lx, y + 0.12, label, ha='center', va='bottom', fontsize=8,
                bbox=dict(boxstyle='round,pad=0.2', facecolor='white', edgecolor='none', alpha=0.85))

    for y, x1, x2, label in messages:
        arrow(y, x1, x2, label, x1 == x2)

    for x, y_start, y_end in [(r, 6.8, 4.3), (d, 6.3, 4.8), (s, 5.8, 5.2)]:
        ax.add_patch(mpatches.Rectangle(
            (x - 0.08, y_end), 0.16, y_start - y_end,
            facecolor='#bfdbfe', edgecolor='#2563eb', linewidth=0.8))

    out = DIAGRAMS / 'sequence_diagram.png'
    fig.tight_layout()
    fig.savefig(out, dpi=220, bbox_inches='tight', facecolor='white')
    plt.close(fig)
    return out


def draw_erd_diagram():
    fig, ax = plt.subplots(figsize=(16, 11))
    ax.set_xlim(0, 16)
    ax.set_ylim(0, 11)
    ax.axis('off')
    ax.set_title('Figure 3 — Entity Relationship Diagram (ERD)\nJadah Hail Database Schema',
                 fontsize=14, fontweight='bold', pad=14)

    def entity(x, y, w, h, name, fields, color='#eff6ff'):
        rect = FancyBboxPatch(
            (x, y), w, h, boxstyle='square,pad=0',
            linewidth=1.8, edgecolor='#1e40af', facecolor=color
        )
        ax.add_patch(rect)
        header = FancyBboxPatch(
            (x, y + h - 0.45), w, 0.45, boxstyle='square,pad=0',
            linewidth=0, facecolor='#1e40af'
        )
        ax.add_patch(header)
        ax.text(x + w / 2, y + h - 0.22, name, ha='center', va='center',
                fontsize=9, fontweight='bold', color='white')
        for i, field in enumerate(fields):
            ax.text(x + 0.12, y + h - 0.65 - i * 0.28, field, ha='left', va='top',
                    fontsize=7.5, family='monospace', color='#1e293b')

    # Entities
    entity(0.5, 7.8, 2.8, 1.9, 'User', ['PK  id', 'username', 'email', 'password'])
    entity(0.5, 5.2, 2.8, 2.0, 'UserProfile', ['PK  id', 'FK  user_id', 'preferred_language', 'interests (JSON)'])
    entity(4.2, 7.5, 3.2, 2.6, 'TouristPlace', [
        'PK  id', 'name_ar, name_en', 'description', 'category',
        'latitude, longitude', 'image', 'visiting_hours',
    ])
    entity(8.3, 7.5, 2.8, 2.0, 'Review', ['PK  id', 'FK  user_id', 'FK  tourist_place_id', 'rating', 'comment'])
    entity(12.0, 7.8, 3.0, 2.2, 'TouristRoute', ['PK  id', 'name, name_ar', 'duration', 'difficulty'])
    entity(12.0, 4.8, 3.0, 2.4, 'Event', ['PK  id', 'title_ar/en', 'location', 'start_date', 'end_date', 'image'])
    entity(4.2, 4.0, 3.2, 2.2, 'AssistantReply', ['PK  id', 'prompt_ar/en', 'response_ar/en', 'keywords', 'category'])
    entity(8.3, 4.0, 2.8, 1.5, 'AssistantFallback', ['PK  id', 'message_ar', 'message_en'])

    # Junction table
    entity(12.0, 2.0, 3.0, 1.8, 'Route_Places (M2M)', ['FK  route_id', 'FK  place_id'])
    entity(0.5, 2.0, 2.8, 1.8, 'Profile_Favorites (M2M)', ['FK  profile_id', 'FK  place_id'])

    def rel(x1, y1, x2, y2, label, color='#64748b'):
        ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                    arrowprops=dict(arrowstyle='-', color=color, lw=1.4))
        mx, my = (x1 + x2) / 2, (y1 + y2) / 2
        if label:
            ax.text(mx, my + 0.12, label, ha='center', fontsize=7.5,
                    color='#475569', bbox=dict(boxstyle='round,pad=0.15', facecolor='white', alpha=0.9))

    # Relationships
    rel(3.3, 8.5, 4.2, 8.5, '1 : 1')
    rel(3.3, 6.2, 0.5, 3.5, 'M : M', '#059669')
    rel(3.3, 6.2, 4.2, 8.0, '', '#059669')
    rel(7.4, 8.5, 8.3, 8.5, '1 : M')
    rel(7.4, 8.0, 8.3, 8.2, '1 : M')
    rel(11.5, 8.5, 12.0, 8.5, 'M : M')
    rel(13.5, 7.8, 13.5, 3.8, '', '#64748b')
    rel(5.8, 7.5, 5.8, 6.2, '', '#64748b')
    rel(1.9, 5.2, 1.9, 3.8, 'M : M', '#059669')

    ax.text(8.0, 0.5,
            'Legend: PK = Primary Key  |  FK = Foreign Key  |  M2M = Many-to-Many junction table',
            ha='center', fontsize=8, color='#64748b', style='italic')

    out = DIAGRAMS / 'erd_diagram.png'
    fig.tight_layout()
    fig.savefig(out, dpi=220, bbox_inches='tight', facecolor='white')
    plt.close(fig)
    return out


def draw_architecture_diagram():
    fig, ax = plt.subplots(figsize=(14, 8))
    ax.set_xlim(0, 14)
    ax.set_ylim(0, 8)
    ax.axis('off')
    ax.set_title('Figure 4 — Three-Tier System Architecture\nJadah Hail Platform',
                 fontsize=14, fontweight='bold', pad=14)

    layers = [
        (1.0, 5.2, 12.0, 2.0, 'Presentation Layer', '#dbeafe', '#2563eb', [
            'React 18 + TypeScript + Vite + Tailwind CSS',
            'Components: HailMap (Leaflet), TourismContext, AIAssistant, AdminDashboard',
            'Runs in browser — http://localhost:5173',
        ]),
        (1.0, 2.8, 12.0, 2.0, 'Application Layer', '#dcfce7', '#16a34a', [
            'Django 6 + Django REST Framework',
            'Apps: tourism, events, accounts, ai_assistant',
            'REST API — http://127.0.0.1:8000/api/v1/',
        ]),
        (1.0, 0.4, 12.0, 2.0, 'Data Layer', '#fef3c7', '#d97706', [
            'SQLite 3 database (db.sqlite3)',
            'Media storage: tourist_places/, events/ images',
            'Django ORM models & migrations',
        ]),
    ]

    for x, y, w, h, title, bg, border, lines in layers:
        box = FancyBboxPatch((x, y), w, h, boxstyle='round,pad=0.03',
                             linewidth=2, edgecolor=border, facecolor=bg, alpha=0.85)
        ax.add_patch(box)
        ax.text(x + 0.3, y + h - 0.35, title, fontsize=11, fontweight='bold', color=border)
        for i, line in enumerate(lines):
            ax.text(x + 0.4, y + h - 0.75 - i * 0.35, f'• {line}', fontsize=9, color='#334155')

    for y_from, y_to in [(5.2, 4.8), (2.8, 2.4)]:
        ax.annotate('', xy=(7, y_to), xytext=(7, y_from),
                    arrowprops=dict(arrowstyle='<->', color='#1e40af', lw=2.5))
        ax.text(7.35, (y_from + y_to) / 2, 'HTTP/JSON\nREST + Session Auth',
                fontsize=8, color='#1e40af', va='center')

    # External services
    ext = FancyBboxPatch((0.3, 6.0), 2.2, 1.0, boxstyle='round,pad=0.02',
                         linewidth=1.5, edgecolor='#64748b', facecolor='#f1f5f9')
    ax.add_patch(ext)
    ax.text(1.4, 6.5, 'OpenStreetMap\n(Map Tiles)', ha='center', va='center', fontsize=8)
    ax.annotate('', xy=(3.5, 6.2), xytext=(2.5, 6.2),
                arrowprops=dict(arrowstyle='->', color='#64748b', lw=1.2))

    user = FancyBboxPatch((11.5, 6.0), 2.2, 1.0, boxstyle='round,pad=0.02',
                          linewidth=1.5, edgecolor='#64748b', facecolor='#f1f5f9')
    ax.add_patch(user)
    ax.text(12.6, 6.5, 'Visitor /\nAdmin User', ha='center', va='center', fontsize=8)
    ax.annotate('', xy=(11.0, 6.2), xytext=(12.5, 6.2),
                arrowprops=dict(arrowstyle='->', color='#64748b', lw=1.2))

    out = DIAGRAMS / 'architecture_diagram.png'
    fig.tight_layout()
    fig.savefig(out, dpi=220, bbox_inches='tight', facecolor='white')
    plt.close(fig)
    return out


if __name__ == '__main__':
    paths = [
        draw_use_case_diagram(),
        draw_sequence_diagram(),
        draw_erd_diagram(),
        draw_architecture_diagram(),
    ]
    for p in paths:
        print(f'Created: {p}')
