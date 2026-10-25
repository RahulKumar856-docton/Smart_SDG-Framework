from app import create_app
app = create_app()
rules = sorted([f"{rule.rule} -> {rule.endpoint}" for rule in app.url_map.iter_rules()])
for r in rules:
    print(r)
