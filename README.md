## Projeto de ERP para CT para STARA

## Guia rápido:

É necessário instalar o Clasp para enviar atualizações para o GAS
É necessário definir um project ID em .clasp.json
```
npm install -g @google/clasp
```

Comandos úteis:

```
clasp push
clasp push --watch
clasp pull
clasp deploy
```

Para dev, é recomendado usar o deploy de teste disponível no editor do GAS pois sempre reflete a versão mais recente dos arquivos.

As mudanças só são refletidas no app após `clasp push` na 'implatação' de testes q é privada pro dono do projeto. Para ficar público é necessário criar uma nova 'implementação' no projeto em https://scrips.google.com/
