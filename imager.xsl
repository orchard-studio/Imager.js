<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

    <xsl:template name="imager">
        <xsl:param name="image"/>
        <xsl:param name="width"/>
        <xsl:param name="class" select="'imager'"/>
        <div class="{$class}" data-src="/image/1/{$width}/0{$image/@path}/{$image/filename}" data-width="{$width}"></div>
    </xsl:template>

</xsl:stylesheet>