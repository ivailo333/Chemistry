from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).parent
STATIC_DIR = ROOT / "static"


REACTIONS = [
    {
        "id": "copper-hydroxide",
        "title": "Меден сулфат + натриева основа",
        "level": "7. клас",
        "type": "Утаяване",
        "energy": "Слабо отделяне на топлина",
        "difficulty": 2,
        "reagents": [
            {"name": "CuSO4", "label": "Меден сулфат", "color": "#32a9df", "state": "воден разтвор"},
            {"name": "NaOH", "label": "Натриева основа", "color": "#d8f2ff", "state": "воден разтвор"},
        ],
        "products": [
            {"name": "Cu(OH)2", "label": "Меден хидроксид", "color": "#39b7e8", "state": "синя утайка"},
            {"name": "Na2SO4", "label": "Натриев сулфат", "color": "#eef9ff", "state": "разтвор"},
        ],
        "equation": "CuSO4 + 2NaOH -> Cu(OH)2↓ + Na2SO4",
        "observation": "Появява се светлосиня желеобразна утайка от меден хидроксид.",
        "explanation": "Йоните Cu2+ и OH- се свързват и образуват слаборазтворим Cu(OH)2.",
        "safety": "Натриевата основа е разяждаща. Работи се с очила и ръкавици.",
        "particles": "precipitate",
        "quiz": {
            "question": "Кое вещество образува синята утайка?",
            "answers": ["Cu(OH)2", "Na2SO4", "NaOH"],
            "correct": 0,
        },
    },
    {
        "id": "vinegar-soda",
        "title": "Оцет + сода бикарбонат",
        "level": "6. клас",
        "type": "Газоотделяне",
        "energy": "Леко охлаждане",
        "difficulty": 1,
        "reagents": [
            {"name": "CH3COOH", "label": "Оцетна киселина", "color": "#fff2bc", "state": "разтвор"},
            {"name": "NaHCO3", "label": "Сода бикарбонат", "color": "#ffffff", "state": "прах"},
        ],
        "products": [
            {"name": "CO2", "label": "Въглероден диоксид", "color": "#f7fbff", "state": "газ"},
            {"name": "CH3COONa", "label": "Натриев ацетат", "color": "#f6efd7", "state": "разтвор"},
            {"name": "H2O", "label": "Вода", "color": "#cfeeff", "state": "течност"},
        ],
        "equation": "CH3COOH + NaHCO3 -> CH3COONa + CO2↑ + H2O",
        "observation": "Сместа започва да шупти, защото се отделя въглероден диоксид.",
        "explanation": "Киселината реагира с хидрогенкарбоната и се образува газ CO2.",
        "safety": "Реакцията е подходяща за демонстрация, но не се опитва на вкус.",
        "particles": "bubbles",
        "quiz": {
            "question": "Кой газ причинява шуптенето?",
            "answers": ["CO2", "O2", "H2"],
            "correct": 0,
        },
    },
    {
        "id": "silver-chloride",
        "title": "Сребърен нитрат + натриев хлорид",
        "level": "8. клас",
        "type": "Утаяване",
        "energy": "Без видимо загряване",
        "difficulty": 2,
        "reagents": [
            {"name": "AgNO3", "label": "Сребърен нитрат", "color": "#eff6ff", "state": "разтвор"},
            {"name": "NaCl", "label": "Натриев хлорид", "color": "#f8fbff", "state": "разтвор"},
        ],
        "products": [
            {"name": "AgCl", "label": "Сребърен хлорид", "color": "#f3f4f6", "state": "бяла утайка"},
            {"name": "NaNO3", "label": "Натриев нитрат", "color": "#eef8ff", "state": "разтвор"},
        ],
        "equation": "AgNO3 + NaCl -> AgCl↓ + NaNO3",
        "observation": "Получава се бяла, мътна утайка от сребърен хлорид.",
        "explanation": "Ag+ и Cl- образуват AgCl, който почти не се разтваря във вода.",
        "safety": "Сребърният нитрат оставя тъмни петна по кожа и тъкани.",
        "particles": "snow",
        "quiz": {
            "question": "Какъв е цветът на AgCl?",
            "answers": ["Бял", "Син", "Червен"],
            "correct": 0,
        },
    },
    {
        "id": "iron-copper",
        "title": "Желязо + меден сулфат",
        "level": "7. клас",
        "type": "Заместване",
        "energy": "Бавна реакция",
        "difficulty": 3,
        "reagents": [
            {"name": "Fe", "label": "Желязо", "color": "#9ca3af", "state": "метал"},
            {"name": "CuSO4", "label": "Меден сулфат", "color": "#2eaee8", "state": "разтвор"},
        ],
        "products": [
            {"name": "Cu", "label": "Мед", "color": "#c76931", "state": "метален налеп"},
            {"name": "FeSO4", "label": "Железен сулфат", "color": "#b9e7c2", "state": "разтвор"},
        ],
        "equation": "Fe + CuSO4 -> FeSO4 + Cu",
        "observation": "Върху желязото се отлага червеникавокафява мед, а разтворът позеленява.",
        "explanation": "Желязото е по-активно от медта и я измества от нейното съединение.",
        "safety": "Не докосвай металите след реакция без ръкавици.",
        "particles": "metal",
        "quiz": {
            "question": "Кой метал измества медта?",
            "answers": ["Fe", "Ag", "Au"],
            "correct": 0,
        },
    },
    {
        "id": "indicator",
        "title": "Фенолфталеин + основа",
        "level": "6. клас",
        "type": "Индикатор",
        "energy": "Без топлинен ефект",
        "difficulty": 1,
        "reagents": [
            {"name": "NaOH", "label": "Натриева основа", "color": "#eefaff", "state": "разтвор"},
            {"name": "C20H14O4", "label": "Фенолфталеин", "color": "#ffffff", "state": "индикатор"},
        ],
        "products": [
            {"name": "розов разтвор", "label": "Алкална среда", "color": "#ff5aae", "state": "оцветяване"},
        ],
        "equation": "фенолфталеин + основа -> малиново-розово оцветяване",
        "observation": "Безцветният индикатор става ярко розов в основна среда.",
        "explanation": "Фенолфталеинът променя строежа си при високо pH и поглъща светлина по различен начин.",
        "safety": "Индикаторът и основата не се пипат с ръце.",
        "particles": "color",
        "quiz": {
            "question": "Какво показва розовият цвят?",
            "answers": ["Основна среда", "Кисела среда", "Чиста вода"],
            "correct": 0,
        },
    },
]


class ChemistryHandler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        clean_path = urlparse(path).path
        if clean_path == "/":
            return str(STATIC_DIR / "index.html")
        return str(STATIC_DIR / clean_path.lstrip("/"))

    def do_GET(self):
        if self.path.startswith("/api/reactions"):
            payload = json.dumps(REACTIONS, ensure_ascii=False).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
            return
        super().do_GET()

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


def run():
    server = ThreadingHTTPServer(("127.0.0.1", 8000), ChemistryHandler)
    print("Химична лаборатория: http://127.0.0.1:8000")
    server.serve_forever()


if __name__ == "__main__":
    run()
