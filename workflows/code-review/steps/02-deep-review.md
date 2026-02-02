Com base nos findings do passo anterior, faca revisao profunda:

1. **Seguranca**: Inputs validados? SQL/command injection? Secrets hardcoded? Auth correto?
2. **Logica de Negocio**: A implementacao atende os requisitos? Ha edge cases nao cobertos?
3. **Performance**: N+1 queries? Loops desnecessarios? Memory leaks? Operacoes bloqueantes?
4. **Testes**: Cobertura adequada? Testes testam comportamento real (nao implementacao)?
5. **Dependencias**: Imports adequados? Sem dependencias circulares? Bibliotecas atualizadas?

Classifique cada finding: Critico / Importante / Sugestao.

Output: Lista de findings profundos com severidade.
