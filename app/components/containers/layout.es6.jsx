// Представляет аналог файла layouts/application.html в Rails
import { Link } from 'react-router-dom'
import React from 'react'
import { path_settings, seo_link } from '../../../config/seo_settings'

class Layout extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    return (
      <div className='markup__content'>
        {this.props.children}
      </div>
    )
  }
}

export default Layout
