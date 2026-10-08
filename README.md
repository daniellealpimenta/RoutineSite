# RoutineSite

Um plano de 12 semanas de **dieta, treino e rotina** que se adapta a você, e um gráfico de constância para acompanhar se você está seguindo.

Você preenche seu perfil (idade, peso, altura, objetivo, horários e dias de treino) e o site monta metas de calorias e macros, um cardápio com horários, as fichas de musculação distribuídas na sua semana e a linha do tempo de cada dia. Todo dia você marca o que cumpriu e acompanha a evolução num gráfico estilo GitHub.

É só HTML, CSS e JavaScript: sem cadastro, sem servidor, sem instalar nada. Seus dados ficam no seu navegador.

![Tela inicial com metas do dia, check-in e aviso](docs/screenshots/numeros.png)

## Para que serve

- **Começar ou voltar a treinar com um plano completo**, sem precisar montar dieta, treino e horários separadamente.
- **Encaixar o plano numa rotina apertada**: o treino, as refeições e o sono são distribuídos em volta do seu horário de trabalho/estudo.
- **Criar constância**: o check-in diário (dieta, rotina, treino) alimenta sequências, porcentagens e o mapa de dias.

## Funcionalidades

| Aba | O que faz |
| --- | --- |
| **Números** | Gasto basal (média de Mifflin-St Jeor e Harris-Benedict), gasto total, meta de calorias, IMC, água e macros. Textos de expectativa e ajuste mudam conforme o objetivo. |
| **Dieta** | Cardápio com 2 opções por refeição, horários calculados pela sua rotina, total do dia comparado à meta e aviso de quanto aumentar/diminuir as porções. |
| **Treino** | Fichas A, B, C e D distribuídas nos dias que você escolheu, com checkbox por exercício e dicas de progressão. |
| **Rotina** | Resumo da semana e linha do tempo de cada tipo de dia (treino, dia leve, fim de semana), com horas de sono e alertas. |
| **Progresso** | Mapa de persistência de 1 ano, sequência atual, melhor sequência, % dos últimos 30 dias e barras por área. |
| **Perfil** | Seus dados e sua rotina. Tudo o que está acima se recalcula na hora. Também exporta, importa e apaga os dados. |

<table>
  <tr>
    <td><img src="docs/screenshots/perfil.png" alt="Aba Perfil"></td>
    <td><img src="docs/screenshots/rotina.png" alt="Aba Rotina"></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/dieta.png" alt="Aba Dieta"></td>
    <td><img src="docs/screenshots/treino.png" alt="Aba Treino"></td>
  </tr>
  <tr>
    <td colspan="2"><img src="docs/screenshots/progresso.png" alt="Aba Progresso com mapa de persistência"></td>
  </tr>
</table>

Funciona bem no celular e respeita o tema claro/escuro do sistema:

<p>
  <img src="docs/screenshots/mobile-inicio.png" alt="Versão mobile" width="260">
  <img src="docs/screenshots/mobile-progresso-escuro.png" alt="Progresso no tema escuro" width="260">
</p>

## Como usar

Clone e abra o `index.html` no navegador:

```bash
git clone https://github.com/daniellealpimenta/RoutineSite.git
cd RoutineSite
open index.html        # macOS (no Windows: start index.html)
```

Se preferir servir por HTTP (recomendado para celular na mesma rede):

```bash
python3 -m http.server 8000
# acesse http://localhost:8000
```

Também dá para publicar de graça no GitHub Pages, já que é um site estático.

No primeiro acesso o site abre na aba **Perfil** com valores de exemplo. Troque pelos seus e pronto.

## Personalização

Tudo é configurado pela aba **Perfil**:

| Campo | Afeta |
| --- | --- |
| Sexo, idade, peso, altura | Gasto basal, meta de calorias, proteína, IMC, água |
| Objetivo: perder gordura (−15%), recomposição (−8%) ou ganhar massa (+10%) | Meta de calorias, proteína por kg, textos de expectativa e de ajuste |
| Nível de atividade | Multiplicador do gasto total |
| Horário de acordar e de dormir | Linha do tempo, horas de sono, horário das refeições |
| Início e fim das atividades (trabalho, aula...) | Onde o treino e as refeições se encaixam |
| Treino antes ou depois das atividades | Horário do treino em dia útil (antes = acordar mais cedo) |
| Dias de treino | Divisão das fichas: 1–2 dias = corpo inteiro, 3 = ABC, 4+ = ABCD |
| Sobre sua rotina | Texto livre que aparece como lembrete na aba Rotina |

Quer mudar o conteúdo do plano em si? Ele está em arquivos simples de dados:

- Cardápio: [`src/domain/plano/refeicoes.js`](src/domain/plano/refeicoes.js)
- Fichas de treino: [`src/domain/plano/treinos.js`](src/domain/plano/treinos.js)
- Objetivos e níveis de atividade: [`src/domain/perfil.js`](src/domain/perfil.js)

## Onde ficam os dados

Tudo é salvo no **`localStorage` do navegador**, com chaves que começam com `rd-` (perfil, check-ins, escolhas do cardápio, exercícios marcados). Isso significa que:

- nada é enviado para servidor nenhum;
- os dados continuam lá quando você fecha e abre o site;
- cada navegador/aparelho tem os seus próprios dados, e limpar os dados do site apaga tudo.

Para levar seus dados para outro aparelho ou guardar uma cópia, use **Perfil → Exportar backup** (gera um `.json`) e depois **Importar backup** no outro navegador.

## Arquitetura

Sem framework e sem build. Os scripts são carregados em ordem no `index.html`, de dentro para fora, e cada camada só usa as anteriores:

```
src/
├── shared/         utilitários sem regra de negócio (datas, formatação)
├── domain/         o plano e as regras, em funções puras
│   ├── perfil.js     perfil padrão, objetivos, validação
│   ├── plano/        dados: refeições, treinos, categorias do check-in
│   └── regras/       calculadora, cardápio, progresso, geração da rotina
├── data/           onde as coisas ficam salvas (localStorage + repositórios)
├── application/    casos de uso: o que o usuário pode fazer
├── presentation/   telas, componentes, navegação e CSS
└── main.js         liga tudo
```

Trocar o `localStorage` por uma API, por exemplo, só mexe em `src/data/`.

## Aviso

As fórmulas dão estimativas com margem de uns 10%, e o plano é um ponto de partida genérico, não uma prescrição. Se você tem alguma condição de saúde, toma medicação, está grávida ou tem histórico de transtorno alimentar, passe o plano por um médico ou nutricionista antes.

## Licença

Distribuído sob a licença MIT. Veja [`LICENSE`](LICENSE).
