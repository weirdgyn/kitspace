import Link from 'next/link'
import Head from 'next/head'
import React from 'react'
import * as semantic from 'semantic-ui-react'
import Gitlab from '@kitspace/gitlab-client'
import gitUrlParse from 'git-url-parse'

import './new.scss'

const gitlab = new Gitlab(
  process.env.KITSPACE_DOMAIN + ':' + process.env.KITSPACE_PORT + '/!gitlab',
)

if (typeof window !== 'undefined') {
  window.gitlab = gitlab
}

export default class New extends React.Component {
  state = {import_url: 'https://github.com/kitspace/ruler'}
  static async getInitialProps({req, gitlab}) {
    const [token, project_names] = await Promise.all([
      gitlab.getAuthenticity(),
      gitlab.getUserProjects().then(ps => ps.map(p => p.name)),
    ])
    return {token, project_names}
  }
  handleImport = e => {
    const {import_url} = this.state
    let name = gitUrlParse(import_url)
      .full_name.split('/')
      .pop()
    let i = 0
    while (this.props.project_names.includes(name) && i++ < 10000) {
      name = incrementName(name)
    }
    gitlab
      .createProject(
        {name, import_url, visibility: 'public'},
        null,
        this.props.token,
      )
      .then(r => console.log({r}))
  }
  render() {
    return (
      <>
        <Head>
          <title>New Project - Kitspace</title>
        </Head>
        <semantic.Segment className="New">
          <div className="ui two column stackable center aligned grid">
            <semantic.Grid.Row verticalAlign="middle">
              <semantic.Grid.Column>
                <p>Upload Gerbers, CAD files, BOM (csv, xlsx, ods)</p>
                <semantic.Button color="green">Upload Files</semantic.Button>
              </semantic.Grid.Column>
              <div className="dividerContainer">
                <semantic.Divider vertical>Or</semantic.Divider>
              </div>
              <semantic.Grid.Column>
                <p>Import and link an existing Git repository</p>
                <semantic.Input
                  action={{
                    content: 'Import',
                    color: 'green',
                    onClick: this.handleImport,
                  }}
                  onChange={e => this.setState({import_url: e.target.value})}
                  value={this.state.import_url}
                />
              </semantic.Grid.Column>
            </semantic.Grid.Row>
          </div>
        </semantic.Segment>
      </>
    )
  }
}

function incrementName(name) {
  const ns = name.split(/\D/)
  const lastN = ns[ns.length - 1]
  const n = parseInt(lastN, 10)
  if (isNaN(n)) {
    return name + '2'
  }
  return name.slice(0, name.lastIndexOf(lastN)) + String(n + 1)
}
