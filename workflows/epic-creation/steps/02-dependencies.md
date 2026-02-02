Com base nos epics definidos no passo anterior, mapeie dependencias:

1. **Grafo de Dependencias**: Quais epics dependem de quais?
2. **Caminho Critico**: Qual sequencia de epics determina o prazo total?
3. **Paralelismo**: Quais epics podem ser executados em paralelo?
4. **Dependencias Externas**: APIs, servicos ou decisoes de terceiros necessarias
5. **Riscos de Dependencia**: O que acontece se uma dependencia atrasa?

Nao deve haver dependencias circulares. Se encontrar, revise a decomposicao.

Output: Mapa de dependencias com ordem sugerida de execucao.
