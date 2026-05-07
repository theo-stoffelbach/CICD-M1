# Workflow Git — Wordle CI/CD

## Modèle : Git Flow simplifié

## Branches

| Branche | But | Règle d'or |
|---------|-----|------------|
| `main` | Production / démo finale | **Ne jamais push directement** |
| `develop` | Intégration continue | C'est ici que les features se rejoignent |
| `US-MET-XX-back` | Feature backend | Part de `develop`, merge dans `develop` |
| `US-MET-XX-front` | Feature frontend | Part de `develop`, merge dans `develop` |
| `US-DEV-XX` | Feature DevOps | Part de `develop`, merge dans `develop` |

---

## 🔁 Cycle de vie d'une US

### 1. Créer la branche feature

```bash
git checkout develop
git pull origin develop
git checkout -b US-MET-02-back
```

### 2. Développer

```bash
# code, test...
git add .
git commit -m "feat(auth): login JWT"
git push -u origin US-MET-02-back
```

### 3. Pull Request

- Sur GitHub, ouvrir une **Pull Request** : `US-MET-02-back` → `develop`
- Un autre membre du groupe review et approuve
- Merge via **"Create a merge commit"** ou **"Squash and merge"**

### 4. Nettoyer

```bash
git checkout develop
git pull origin develop
git branch -d US-MET-02-back        # suppression locale
git push origin --delete US-MET-02-back  # suppression remote
```

---

## 🚀 Livraison (merge vers main)

Quand le projet est prêt à être évalué :

```bash
# Depuis GitHub, créer une PR : develop → main
# Review finale, puis merge
```

---

## 🆘 Résolution de conflits

Si `develop` a avancé pendant que vous codiez :

```bash
git checkout US-MET-02-back
git fetch origin
git rebase origin/develop
# résoudre les conflits si besoin
git push --force-with-lease origin US-MET-02-back
```

---

## 📋 Convention de commits

Format : `type(scope): description`

| Type | Quand l'utiliser |
|------|------------------|
| `feat` | Nouvelle fonctionnalité |
| `fix` | Correction de bug |
| `docs` | Documentation |
| `test` | Ajout/modif de tests |
| `refactor` | Refactoring |
| `ci` | Pipeline CI/CD |
| `chore` | Tâches diverses |

Exemples :
- `feat(auth): ajoute le login JWT`
- `fix(game): corrige le comptage de streak`
- `ci(docker): ajoute le Dockerfile backend`
