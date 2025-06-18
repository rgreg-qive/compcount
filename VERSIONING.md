# 🏷️ Guia de Versionamento - CompCount

Este documento descreve como gerenciar versões do projeto CompCount.

## 📋 Estratégia de Versionamento

### Semantic Versioning (SemVer)
Seguimos o padrão [Semantic Versioning](https://semver.org/lang/pt-BR/):

```
MAJOR.MINOR.PATCH
```

- **MAJOR** (1.x.x): Mudanças incompatíveis na API
- **MINOR** (x.1.x): Novas funcionalidades compatíveis
- **PATCH** (x.x.1): Correções de bugs compatíveis

### Exemplos Práticos

| Tipo de Mudança | Versão Atual | Nova Versão | Comando |
|------------------|--------------|-------------|---------|
| 🐛 Correção de bug | 1.0.0 | 1.0.1 | `npm run release:patch` |
| ✨ Nova funcionalidade | 1.0.1 | 1.1.0 | `npm run release:minor` |
| 💥 Mudança incompatível | 1.1.0 | 2.0.0 | `npm run release:major` |

## 🚀 Como Fazer um Release

### 1. Preparação
```bash
# Certifique-se de estar na branch main
git checkout main
git pull origin main

# Verifique se tudo está funcionando
npm run type-check
npm run build
```

### 2. Atualizar CHANGELOG.md
Antes de fazer o release, atualize o `CHANGELOG.md`:

```markdown
## [1.1.0] - 2025-01-25

### ✨ Adicionado
- Nova funcionalidade X
- Melhoria Y

### 🐛 Corrigido
- Bug Z corrigido
```

### 3. Fazer o Release
```bash
# Para correção de bug (1.0.0 -> 1.0.1)
npm run release:patch

# Para nova funcionalidade (1.0.0 -> 1.1.0)
npm run release:minor

# Para mudança incompatível (1.0.0 -> 2.0.0)
npm run release:major
```

### 4. O que acontece automaticamente:
1. ✅ Build da aplicação
2. ✅ Atualização da versão no `package.json`
3. ✅ Criação de commit de versão
4. ✅ Criação de tag Git
5. ✅ Push para o repositório
6. ✅ Trigger do GitHub Actions
7. ✅ Criação de Release no GitHub
8. ✅ Deploy automático no Vercel

## 🏷️ Convenções de Tags

### Formato das Tags
```
v1.0.0    # Release estável
v1.1.0-beta.1    # Pre-release beta
v2.0.0-rc.1      # Release candidate
```

### Listar Tags
```bash
# Ver todas as tags
git tag -l

# Ver tags com descrição
git tag -l -n1

# Ver detalhes de uma tag específica
git show v1.0.0
```

## 🔄 Workflow de Desenvolvimento

### Branches
- `main`: Código de produção estável
- `develop`: Desenvolvimento ativo
- `feature/*`: Novas funcionalidades
- `hotfix/*`: Correções urgentes

### Fluxo Recomendado
1. Desenvolver na branch `feature/nova-funcionalidade`
2. Fazer merge para `develop`
3. Testar em ambiente de desenvolvimento
4. Fazer merge para `main`
5. Criar release com tag

## 📊 Monitoramento de Versões

### URLs de Produção
- **Atual**: https://compcount.vercel.app
- **Versões anteriores**: Disponíveis via tags Git

### Rollback se Necessário
```bash
# Voltar para versão anterior
git checkout v1.0.0
git checkout -b hotfix/rollback-v1.0.0

# Fazer correções necessárias
# Depois fazer novo release
npm run release:patch
```

## 🔍 Verificação de Versão

### No Código
```typescript
// Adicionar versão no código se necessário
const VERSION = '1.0.0'; // Sincronizar com package.json
```

### No Runtime
```bash
# Ver versão atual
npm list --depth=0

# Ver versão no package.json
node -p "require('./package.json').version"
```

## 📝 Checklist de Release

- [ ] Código testado e funcionando
- [ ] CHANGELOG.md atualizado
- [ ] Versão apropriada escolhida (patch/minor/major)
- [ ] Build passa sem erros
- [ ] Type check passa sem erros
- [ ] Commit e push realizados
- [ ] Tag criada e enviada
- [ ] GitHub Release criado
- [ ] Deploy no Vercel confirmado
- [ ] Funcionalidade testada em produção

---

## 🆘 Troubleshooting

### Erro no Release
```bash
# Se algo der errado, você pode:
# 1. Deletar tag local
git tag -d v1.1.0

# 2. Deletar tag remota
git push origin --delete v1.1.0

# 3. Corrigir problema e tentar novamente
npm run release:patch
```

### Versão Incorreta
```bash
# Corrigir versão manualmente
npm version 1.1.0 --no-git-tag-version
git add package.json
git commit -m "🔧 Corrigir versão para 1.1.0"
``` 